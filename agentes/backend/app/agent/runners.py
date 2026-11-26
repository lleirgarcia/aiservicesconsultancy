"""Adaptadores de proveedor de IA.

La lógica de negocio solo conoce la interfaz AgentRunner. Para cambiar de proveedor
o de modelo se añade otro adaptador o se cambia KROOMIX_MODEL; no se toca nada más.
"""

from __future__ import annotations

import copy
import json
import logging
import os
from dataclasses import dataclass
from typing import Any, Callable, Protocol

from app.tools.base import RunContext, ToolError, ToolOutcome, ToolSpec

log = logging.getLogger("kroomix.agent")

ExecuteFn = Callable[[RunContext, ToolSpec, dict[str, Any]], "ToolOutcome | ToolError"]
# Si el agente termina sin cerrar el expediente, devuelve el recordatorio que se le envía (o None).
FollowupFn = Callable[[], "str | None"]


@dataclass
class RunStats:
    turns: int = 0
    cost_usd: float | None = None
    stop: str | None = None
    error: str | None = None


class AgentRunner(Protocol):
    async def run(self, ctx: RunContext, system_prompt: str, user_message: str,
                  tools: list[ToolSpec], execute: ExecuteFn, followup: FollowupFn | None = None) -> RunStats: ...


def inline_schema(model) -> dict:
    """JSON Schema de un modelo Pydantic con las referencias $defs resueltas en línea."""
    schema = model.model_json_schema()
    defs = schema.pop("$defs", {})

    def resolve(node, in_properties=False):
        if isinstance(node, dict):
            if "$ref" in node:
                return resolve(copy.deepcopy(defs[node["$ref"].split("/")[-1]]))
            # "title" es una anotación de Pydantic salvo cuando es el NOMBRE de un campo (dentro de "properties").
            return {k: resolve(v, in_properties=(k == "properties" and not in_properties))
                    for k, v in node.items() if in_properties or k != "title"}
        if isinstance(node, list):
            return [resolve(x) for x in node]
        return node

    return resolve(schema)


def outcome_to_content(result: ToolOutcome | ToolError) -> dict[str, Any]:
    if isinstance(result, ToolError):
        body = {"error": str(result), "code": result.code}
        if result.hint:
            body["hint"] = result.hint
        return {"content": [{"type": "text", "text": json.dumps(body, ensure_ascii=False)}], "is_error": True}
    content: list[dict] = [{"type": "text", "text": json.dumps(result.data, ensure_ascii=False, default=str)}]
    for data, mime in result.images:
        content.append({"type": "image", "data": data, "mimeType": mime})
    return {"content": content}


class ClaudeAgentSDKRunner:
    """Claude vía Claude Agent SDK: usa la sesión del CLI `claude` (suscripción), sin clave de API en el código."""

    SERVER = "kroomix"

    def __init__(self, model: str, effort: str, max_turns: int):
        self.model, self.effort, self.max_turns = model, effort, max_turns

    MAX_FOLLOWUPS = 2

    async def run(self, ctx, system_prompt, user_message, tools, execute, followup=None) -> RunStats:
        from claude_agent_sdk import (AssistantMessage, ClaudeAgentOptions, ClaudeSDKClient, ResultMessage,
                                      ToolAnnotations, create_sdk_mcp_server, tool)

        sdk_tools = []
        for spec in tools:
            def make(spec: ToolSpec):
                async def handler(args: dict[str, Any]) -> dict[str, Any]:
                    return outcome_to_content(execute(ctx, spec, args))
                return tool(spec.name, spec.description, inline_schema(spec.input_model),
                            annotations=ToolAnnotations(readOnlyHint=spec.read_only))(handler)
            sdk_tools.append(make(spec))

        server = create_sdk_mcp_server(self.SERVER, tools=sdk_tools)
        env = {k: "" for k in ("CLAUDECODE", "CLAUDE_CODE_ENTRYPOINT") if k in os.environ}
        options = ClaudeAgentOptions(
            tools=[],  # sin herramientas integradas (ni ficheros, ni shell, ni web)
            mcp_servers={self.SERVER: server},
            allowed_tools=[f"mcp__{self.SERVER}__{t.name}" for t in tools],
            system_prompt=system_prompt,
            model=self.model,
            effort=self.effort,  # type: ignore[arg-type]
            max_turns=self.max_turns,
            setting_sources=[],
            permission_mode="bypassPermissions",
            env=env,
            stderr=lambda line: log.debug("cli: %s", line),
        )
        stats = RunStats()
        async with ClaudeSDKClient(options=options) as client:
            message: str | None = user_message
            attempts = 0
            while message:
                await client.query(message)
                async for msg in client.receive_response():
                    if isinstance(msg, AssistantMessage):
                        stats.turns += 1
                        for block in msg.content:
                            kind = type(block).__name__
                            if kind == "TextBlock":
                                log.info("agente dice: %s", block.text[:300])
                            elif kind == "ToolUseBlock":
                                log.info("agente llama: %s", block.name)
                        if getattr(msg, "error", None):
                            stats.error = str(msg.error)
                    elif isinstance(msg, ResultMessage):
                        stats.cost_usd = (stats.cost_usd or 0) + (msg.total_cost_usd or 0)
                        stats.stop = msg.terminal_reason or msg.subtype
                        if msg.is_error:
                            stats.error = "; ".join(msg.errors or []) or msg.subtype
                if stats.error or attempts >= self.MAX_FOLLOWUPS or not followup:
                    break
                message = followup()
                attempts += 1
                if message:
                    log.info("follow-up %s: %s", attempts, message)
        return stats


def build_runner(settings) -> AgentRunner:
    if settings.ai_provider == "claude-agent-sdk":
        return ClaudeAgentSDKRunner(settings.model, settings.effort, settings.max_turns)
    raise ValueError(f"Proveedor de IA no soportado: {settings.ai_provider}")
