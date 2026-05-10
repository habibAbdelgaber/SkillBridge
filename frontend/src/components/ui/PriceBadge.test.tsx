import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PriceBadge } from "@/components/ui/PriceBadge";

describe("PriceBadge", () => {
  it("renders hourly pricing", () => {
    render(<PriceBadge hourly={89} />);

    expect(screen.getByText("From")).toBeInTheDocument();
    expect(screen.getByText("$89")).toBeInTheDocument();
    expect(screen.getByText("/hr")).toBeInTheDocument();
  });

  it("renders nothing when no price is provided", () => {
    const { container } = render(<PriceBadge />);

    expect(container).toBeEmptyDOMElement();
  });
});
