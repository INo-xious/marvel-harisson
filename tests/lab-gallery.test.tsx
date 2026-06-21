import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LabGallery } from "@/components/lab-gallery";
import { labItems } from "@/data/lab-items";

describe("LabGallery", () => {
  it("opens a modal and closes it with Escape", async () => {
    render(<LabGallery items={[labItems[0]]} />);
    fireEvent.click(screen.getByRole("button", { name: /open robotics sketch/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Concept visualization")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("closes when the modal backdrop is clicked", async () => {
    render(<LabGallery items={[labItems[0]]} />);
    fireEvent.click(screen.getByRole("button", { name: /open robotics sketch/i }));
    const dialog = screen.getByRole("dialog");
    const backdrop = dialog.parentElement as HTMLElement;
    fireEvent.mouseDown(backdrop);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
