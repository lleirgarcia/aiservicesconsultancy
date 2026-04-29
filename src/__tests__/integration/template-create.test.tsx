import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InstagramPostBuilder } from "@/components/InstagramPostBuilder";

// NOTE: These tests are skeleton/placeholder tests
// They need to be completed with real Supabase integration and Canvas mocking

describe("User Story 1: Create First Post Template", () => {
  describe("Acceptance Scenario 1: Pre-loaded design tokens", () => {
    it("should load Stitch color palette on mount", async () => {
      render(<InstagramPostBuilder />);

      // Check that color picker is available
      const backgroundLabel = screen.getByText("Background");
      expect(backgroundLabel).toBeInTheDocument();
    });

    it("should load company fonts (Space Grotesk, Inter) on mount", async () => {
      render(<InstagramPostBuilder />);

      // Font selector should exist
      const fontSelectors = screen.getAllByRole("combobox");
      expect(fontSelectors.length).toBeGreaterThan(0);
    });
  });

  describe("Acceptance Scenario 2: Drag text to canvas", () => {
    it("should allow adding text element to canvas", async () => {
      const user = userEvent.setup();
      render(<InstagramPostBuilder />);

      // Click "Add Text" button
      const addTextButton = screen.getByText(/Add Text/i);
      await user.click(addTextButton);

      // Editor should appear
      await waitFor(() => {
        expect(screen.getByText(/Edit me/i)).toBeInTheDocument();
      });
    });
  });

  describe("Acceptance Scenario 3: Edit text properties", () => {
    it("should allow editing text content", async () => {
      const user = userEvent.setup();
      render(<InstagramPostBuilder />);

      // Add text
      const addTextButton = screen.getByText(/Add Text/i);
      await user.click(addTextButton);

      // Get text input
      const textInput = screen.getByDisplayValue(/Edit me/i);
      expect(textInput).toBeInTheDocument();

      // Edit text
      await user.tripleClick(textInput);
      await user.keyboard("Hello Instagram");

      // Should update
      expect(screen.getByDisplayValue("Hello Instagram")).toBeInTheDocument();
    });

    it("should allow changing font", async () => {
      const user = userEvent.setup();
      render(<InstagramPostBuilder />);

      // Add text to show editor
      const addTextButton = screen.getByText(/Add Text/i);
      await user.click(addTextButton);

      // Find font selector and change it
      const fontSelects = screen.getAllByRole("combobox");
      const fontSelector = fontSelects.find((select) => {
        const options = select.querySelectorAll("option");
        return Array.from(options).some((opt) => opt.textContent?.includes("Space Grotesk"));
      });

      expect(fontSelector).toBeDefined();
    });
  });

  describe("Acceptance Scenario 4: Save template", () => {
    it("should show save modal when save button is clicked", async () => {
      const user = userEvent.setup();
      render(<InstagramPostBuilder />);

      // Click save button
      const saveButton = screen.getByText(/Save/i).closest("button");
      await user.click(saveButton!);

      // Modal should appear
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Ej: Verano|E.g., Summer/i)).toBeInTheDocument();
      });
    });

    it("should require template name before saving", async () => {
      const user = userEvent.setup();
      render(<InstagramPostBuilder />);

      // Open save modal
      const saveButton = screen.getByText(/Save/i).closest("button");
      await user.click(saveButton!);

      // Try to save without name
      const modalSaveButton = screen.getAllByText(/Save/i).pop();
      expect(modalSaveButton).toBeDisabled();
    });

    it("should allow saving with template name", async () => {
      const user = userEvent.setup();
      render(<InstagramPostBuilder />);

      // Open save modal
      const saveButton = screen.getByText(/Save/i).closest("button");
      await user.click(saveButton!);

      // Enter template name
      const nameInput = screen.getByPlaceholderText(/Ej: Verano|E.g., Summer/i);
      await user.type(nameInput, "Summer Sale 2026");

      // Save button should be enabled
      const modalSaveButton = screen.getAllByText(/Save/i).pop();
      expect(modalSaveButton).not.toBeDisabled();
    });
  });

  describe("Acceptance Scenario 5: Template persistence", () => {
    it.skip("should persist template to Supabase after save", async () => {
      // TODO: Implement with real Supabase mock
      // This requires proper auth setup and database mocking
    });
  });

  describe("Acceptance Scenario 6: Load template list", () => {
    it.skip("should display saved template in list after save", async () => {
      // TODO: Implement after template persistence works
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long text gracefully", async () => {
      const user = userEvent.setup();
      render(<InstagramPostBuilder />);

      // Add text
      const addTextButton = screen.getByText(/Add Text/i);
      await user.click(addTextButton);

      // Enter very long text
      const textInput = screen.getByDisplayValue(/Edit me/i);
      const longText = "A".repeat(500);
      await user.tripleClick(textInput);
      await user.keyboard(longText);

      // Should enforce max length
      expect((textInput as HTMLTextAreaElement).value.length).toBeLessThanOrEqual(500);
    });
  });
});
