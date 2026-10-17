import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmojiColorPicker } from "./EmojiColorPicker";

describe("EmojiColorPicker", () => {
  it("picks an emoji", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<EmojiColorPicker emoji={null} color={null} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "🔥" }));
    expect(onChange).toHaveBeenCalledWith({ emoji: "🔥", color: null });
  });

  it("picks a colour and can clear it", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<EmojiColorPicker emoji={null} color={null} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Pine" }));
    expect(onChange).toHaveBeenCalledWith({ emoji: null, color: "pine" });

    await user.click(screen.getByRole("button", { name: "No colour" }));
    expect(onChange).toHaveBeenCalledWith({ emoji: null, color: null });
  });

  it("reflects the current selection with aria-pressed", () => {
    render(<EmojiColorPicker emoji="🌱" color="sky" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "🌱" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Sky" })).toHaveAttribute("aria-pressed", "true");
  });
});
