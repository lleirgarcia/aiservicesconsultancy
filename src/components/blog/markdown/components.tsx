import type { Components } from "react-markdown";
import Image from "next/image";

export const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="font-headline text-3xl md:text-4xl text-[var(--fg)] mt-12 mb-4 leading-tight">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-headline text-2xl md:text-3xl text-[var(--fg)] mt-10 mb-3 leading-tight">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-headline text-xl md:text-2xl text-[var(--fg)] mt-8 mb-2">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="font-headline text-lg text-[var(--fg)] mt-6 mb-2 uppercase tracking-wide">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="text-[var(--muted-hi)] leading-relaxed my-4">{children}</p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      className="text-[var(--accent)] underline underline-offset-2 hover:opacity-80 transition-opacity"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-6 my-4 space-y-1 text-[var(--muted-hi)]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-6 my-4 space-y-1 text-[var(--muted-hi)]">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-[var(--accent)] pl-4 my-6 text-[var(--muted)] italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-0 border-t border-[var(--border)] my-10" />,
  code: ({ children, className }) => {
    const isBlock = (className ?? "").startsWith("language-");
    if (isBlock) {
      return (
        <code className={`block font-mono text-sm ${className ?? ""}`}>
          {children}
        </code>
      );
    }
    return (
      <code className="font-mono text-[0.9em] bg-[var(--bg-soft)] border border-[var(--border)] rounded px-1.5 py-0.5">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-6 p-4 bg-[var(--bg-soft)] border border-[var(--border)] rounded overflow-x-auto text-sm">
      {children}
    </pre>
  ),
  img: (props) => {
    const { src, alt } = props;
    if (!src || typeof src !== "string") return null;
    return (
      <span className="block my-8">
        <Image
          src={src}
          alt={alt ?? ""}
          width={1200}
          height={675}
          className="w-full h-auto rounded border border-[var(--border)]"
          sizes="(max-width: 768px) 100vw, 768px"
        />
        {alt ? (
          <span className="block text-center text-sm text-[var(--muted)] mt-2">
            {alt}
          </span>
        ) : null}
      </span>
    );
  },
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-[var(--bg-soft)] text-[var(--fg)]">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="text-left px-3 py-2 border border-[var(--border)] uppercase tracking-wide text-xs font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 border border-[var(--border)] align-top">
      {children}
    </td>
  ),
  strong: ({ children }) => (
    <strong className="text-[var(--fg)] font-semibold">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
};
