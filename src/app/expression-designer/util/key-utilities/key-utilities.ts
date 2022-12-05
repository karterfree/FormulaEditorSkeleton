import { KeyUsageMode } from "../enums/key-usage-mode.enum";
import { KeyboardKey } from "../enums/keyboard-key.enum";
import { KeyItem } from "../models/key-item";

export class KeyUtilities {
	private _deniedKeys: KeyItem[] = [
		new KeyItem(KeyboardKey.b, KeyUsageMode.ENABLED),
		new KeyItem(KeyboardKey.i, KeyUsageMode.ENABLED),
		new KeyItem(KeyboardKey.u, KeyUsageMode.ENABLED),
		new KeyItem(KeyboardKey.z, KeyUsageMode.ENABLED),
		new KeyItem(KeyboardKey.Control),
		new KeyItem(KeyboardKey.Shift),
		new KeyItem(KeyboardKey.Alt),
		new KeyItem(KeyboardKey.ScrollLock),
		new KeyItem(KeyboardKey.Meta),
		new KeyItem(KeyboardKey.ContextMenu),
		new KeyItem(KeyboardKey.NumLock),
		new KeyItem(KeyboardKey.PageUp),
		new KeyItem(KeyboardKey.PageDown),
		new KeyItem(KeyboardKey.Insert),
		new KeyItem(KeyboardKey.ScrollLock),
		new KeyItem(KeyboardKey.Pause),
		new KeyItem(KeyboardKey.Tab),
		new KeyItem(KeyboardKey.CapsLock),

		new KeyItem(KeyboardKey.o, KeyUsageMode.ENABLED),
		new KeyItem(KeyboardKey.s, KeyUsageMode.ENABLED),
		new KeyItem(KeyboardKey.x, KeyUsageMode.ENABLED),
		new KeyItem(KeyboardKey.v, KeyUsageMode.ENABLED),
	];

	private _moveKeys: KeyItem[] = [
		new KeyItem(KeyboardKey.ArrowLeft),
		new KeyItem(KeyboardKey.ArrowRight),
		new KeyItem(KeyboardKey.ArrowUp),
		new KeyItem(KeyboardKey.ArrowDown),
		new KeyItem(KeyboardKey.End),
		new KeyItem(KeyboardKey.Home),
	];

	private _fKeys: KeyItem[] = [
		new KeyItem(KeyboardKey.F1),
		new KeyItem(KeyboardKey.F2),
		new KeyItem(KeyboardKey.F3),
		new KeyItem(KeyboardKey.F4),
		new KeyItem(KeyboardKey.F5),
		new KeyItem(KeyboardKey.F6),
		new KeyItem(KeyboardKey.F7),
		new KeyItem(KeyboardKey.F8),
		new KeyItem(KeyboardKey.F9),
		new KeyItem(KeyboardKey.F10),
		new KeyItem(KeyboardKey.F11),
		new KeyItem(KeyboardKey.F12),
	];

	private _removedKeys: KeyItem[] = [
		new KeyItem(KeyboardKey.Delete),
		new KeyItem(KeyboardKey.Backspace)
	];

	private _bracketKeys: KeyItem[] = [
		new KeyItem(KeyboardKey.BracketOpen),
		new KeyItem(KeyboardKey.BracketClose)
	];

    private _delimeterKeys: KeyItem[] = [
		new KeyItem(KeyboardKey.Comma)
	];

	private _mathKeys: KeyItem[] = [
		new KeyItem(KeyboardKey.Add),
		new KeyItem(KeyboardKey.Subtract),
		new KeyItem(KeyboardKey.Multiply),
		new KeyItem(KeyboardKey.Divide),
	];

	private _conditionKeys: KeyItem[] = [
		new KeyItem(KeyboardKey.Greater),
		new KeyItem(KeyboardKey.Less),
		new KeyItem(KeyboardKey.Equal),
		new KeyItem(KeyboardKey.Not),
	];

	private _commandKeys: KeyItem[] = [
		new KeyItem(KeyboardKey.AtSign, KeyUsageMode.IGNORED, KeyUsageMode.IGNORED, KeyUsageMode.ENABLED),
	];

	private has(keyItem: KeyItem, list: KeyItem[]): boolean {
		return list.filter(x=>keyItem.equal(x)).length > 0;
	}

	public isDeniedKey(keyItem: KeyItem): boolean {
		return this.has(keyItem, this._deniedKeys);
	}

	public isMoveKey(keyItem: KeyItem): boolean {
		return this.has(keyItem, this._moveKeys);
	}

	public isFKey(keyItem: KeyItem): boolean {
		return this.has(keyItem, this._fKeys);
	}

	public isRemoveKey(keyItem: KeyItem): boolean {
		return this.has(keyItem, this._removedKeys);
	}

	public isChangelessKey(keyItem: KeyItem): boolean {
		return this.isMoveKey(keyItem) || this.isFKey(keyItem);
	}

	public isMathKey(keyItem: KeyItem): boolean {
		return this.has(keyItem, this._mathKeys);
	}

	public isBracketKey(keyItem: KeyItem): boolean {
		return this.has(keyItem, this._bracketKeys);
	}

	public isConditionKey(keyItem: KeyItem): boolean {
		return this.has(keyItem, this._conditionKeys);
	}

    public isDelimeterKey(keyItem: KeyItem): boolean {
        return this.has(keyItem, this._delimeterKeys);
    }
 
	public isSingleOperationKey(keyItem: KeyItem): boolean {
		return this.isMathKey(keyItem) ||
			this.isBracketKey(keyItem) ||
			this.isConditionKey(keyItem) ||
            this.isDelimeterKey(keyItem);
	}

	public isCommandKey(keyItem: KeyItem): boolean {
		return this.has(keyItem, this._commandKeys);
	}
}