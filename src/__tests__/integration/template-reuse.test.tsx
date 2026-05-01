import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InstagramPostBuilder } from "@/components/InstagramPostBuilder";

describe("User Story 2: Reuse Existing Template", () => {
  describe("Acceptance Scenario 1: Template list visibility", () => {
    it.skip("should show all saved templates with thumbnails in library tab", async () => {
      // TODO: Requires Supabase mock with test data
      render(<InstagramPostBuilder />);

      const libraryTab = screen.getByText(/My Templates/i);
      expect(libraryTab).toBeInTheDocument();
    });
  });

  describe("Acceptance Scenario 2: Load template", () => {
    it.skip("should load template when selected from list", async () => {
      // TODO: Requires Supabase mock with test templates
      const user = userEvent.setup();
      render(<InstagramPostBuilder />);

      // Switch to library tab
      const libraryTab = screen.getByText(/My Templates/i);
      await user.click(libraryTab);

      // Select a template
      const templateButton = screen.getByText(/Load/i);
      await user.click(templateButton);

      // Should switch back to create tab with template loaded
      await waitFor(() => {
        expect(screen.getByText(/Create/i)).toBeInTheDocument();
      });
    });
  });

  describe("Acceptance Scenario 3: Edit content only", () => {
    it.skip("should allow editing text content while keeping styling locked", async () => {
      // TODO: Requires Supabase mock and loaded template
      const user = userEvent.setup();
      render(<InstagramPostBuilder />);

      // Load a template (mock)
      // Edit text element
      // Verify styling (colors, fonts) are unchanged
    });
  });

  describe("Acceptance Scenario 4: Download image", () => {
    it("should show export modal when download button is clicked", async () => {
      const user = userEvent.setup();
      render(<InstagramPostBuilder />);

      // Click download button
      const downloadButton = screen.getByText(/Download/i);
      await user.click(downloadButton);

      // Export modal should appear
      await waitFor(() => {
        expect(screen.getByText(/Format/i)).toBeInTheDocument();
      });
    });

    it("should allow selecting PNG or JPEG format", async () => {
      const user = userEvent.setup();
      render(<InstagramPostBuilder />);

      // Open export modal
      const downloadButton = screen.getByText(/Download/i);
      await user.click(downloadButton);

      // Format options should be visible
      const pngOption = screen.getByDisplayValue("png");
      const jpegOption = screen.getByDisplayValue("jpeg");

      expect(pngOption).toBeInTheDocument();
      expect(jpegOption).toBeInTheDocument();
    });

    it("should show quality slider only for JPEG", async () => {
      const user = userEvent.setup();
      render(<InstagramPostBuilder />);

      // Open export modal
      const downloadButton = screen.getByText(/Download/i);
      await user.click(downloadButton);

      // Select JPEG
      const jpegOption = screen.getByDisplayValue("jpeg");
      await user.click(jpegOption);

      // Quality slider should appear
      await waitFor(() => {
        const qualityInput = screen.getByDisplayValue("95") as HTMLInputElement;
        expect(qualityInput.type).toBe("range");
      });
    });
  });

  describe("Integration: Create → Save → Load → Download", () => {
    it.skip("should complete full workflow without breaking styling", async () => {
      // TODO: End-to-end test with real Supabase mock
      // 1. Create template with custom colors/fonts
      // 2. Save template
      // 3. Switch to library
      // 4. Load template
      // 5. Edit text content
      // 6. Download image
      // 7. Verify styling matches original
    });
  });
});
