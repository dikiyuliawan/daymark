import { EMOJI_SUGGESTIONS, TILE_COLORS } from "../domain/appearance";

type EmojiColorPickerProps = {
  emoji: string | null;
  color: string | null;
  onChange: (next: { emoji: string | null; color: string | null }) => void;
};

export function EmojiColorPicker({ emoji, color, onChange }: EmojiColorPickerProps) {
  return (
    <div className="appearance">
      <div className="appearance-preview">
        <span
          className="tile tile-lg"
          aria-hidden="true"
          style={color ? ({ "--tile": TILE_COLORS.find((c) => c.key === color)?.hex } as React.CSSProperties) : undefined}
        >
          {emoji ?? "•"}
        </span>
        <span className="muted small">Pick an icon and a colour</span>
      </div>
      <div className="emoji-grid" role="group" aria-label="Emoji">
        <button
          type="button"
          className={`emoji-btn${emoji === null ? " is-on" : ""}`}
          aria-pressed={emoji === null}
          onClick={() => onChange({ emoji: null, color })}
        >
          None
        </button>
        {EMOJI_SUGGESTIONS.map((value) => (
          <button
            key={value}
            type="button"
            className={`emoji-btn${emoji === value ? " is-on" : ""}`}
            aria-pressed={emoji === value}
            aria-label={value}
            onClick={() => onChange({ emoji: value, color })}
          >
            {value}
          </button>
        ))}
      </div>
      <div className="swatch-row" role="group" aria-label="Colour">
        <button
          type="button"
          className={`swatch swatch-none${color === null ? " is-on" : ""}`}
          aria-pressed={color === null}
          aria-label="No colour"
          onClick={() => onChange({ emoji, color: null })}
        />
        {TILE_COLORS.map((option) => (
          <button
            key={option.key}
            type="button"
            className={`swatch${color === option.key ? " is-on" : ""}`}
            style={{ "--swatch": option.hex } as React.CSSProperties}
            aria-pressed={color === option.key}
            aria-label={option.label}
            onClick={() => onChange({ emoji, color: option.key })}
          />
        ))}
      </div>
    </div>
  );
}
