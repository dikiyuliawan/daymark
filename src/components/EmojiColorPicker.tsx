import { EMOJI_SUGGESTIONS, TILE_COLORS } from "../domain/appearance";

type EmojiColorPickerProps = {
  emoji: string | null;
  color: string | null;
  onChange: (next: { emoji: string | null; color: string | null }) => void;
};

/**
 * The icon and the colour a task carries: a small preview, a row of icons and
 * a row of colour swatches. No captions, no help text.
 */
export function EmojiColorPicker({ emoji, color, onChange }: EmojiColorPickerProps) {
  return (
    <div className="appearance">
      <div>
        <span className="field-label">Icon</span>
        <div className="emoji-grid" role="group" aria-label="Icon">
          <button
            type="button"
            className={`emoji-btn emoji-btn-none${emoji === null ? " is-on" : ""}`}
            aria-pressed={emoji === null}
            aria-label="No icon"
            onClick={() => onChange({ emoji: null, color })}
          >
            <span aria-hidden="true">–</span>
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
      </div>

      <div>
        <span className="field-label">Colour</span>
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
    </div>
  );
}
