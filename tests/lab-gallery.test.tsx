import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LabGallery } from "@/components/lab-gallery";
import { labItems } from "@/data/lab-items";

describe("LabGallery", () => {
  it("renders the real photo as an external Ri-one link", () => {
    render(<LabGallery items={labItems} />);
    const link = screen.getByRole("link", { name: /open ri-one @home league/i });
    expect(link).toHaveAttribute("href", "https://rione.org/home-league/");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByAltText(/two ri-one members/i)).toBeInTheDocument();
  });
});
