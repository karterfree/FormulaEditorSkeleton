export enum KeyMode {
	IGNORED = 0,
	DISABLED = 1,
	ENABLED = 2
}


export class KeyItem {
	key: string = '';
	ctrMode: KeyMode;
	altMode: KeyMode;
	shiftMode: KeyMode;
	numlockMode: KeyMode;

	constructor(key: string, 
		ctrMode: KeyMode = KeyMode.IGNORED,
		altMode: KeyMode = KeyMode.IGNORED,
		shiftMode: KeyMode = KeyMode.IGNORED,
		numlockMode: KeyMode = KeyMode.IGNORED) {
		this.key = key;
		this.ctrMode = ctrMode;
		this.altMode = altMode;
		this.shiftMode = shiftMode;
		this.numlockMode = numlockMode;
	}

	static fromKeyboardEvent(event: KeyboardEvent): KeyItem {
		var keyItem = new KeyItem(event.key);
		keyItem.ctrMode = event.ctrlKey ? KeyMode.ENABLED : KeyMode.DISABLED;
		keyItem.altMode = event.altKey ? KeyMode.ENABLED : KeyMode.DISABLED;
		keyItem.shiftMode = event.shiftKey ? KeyMode.ENABLED : KeyMode.DISABLED;
		keyItem.numlockMode = event.getModifierState("NumLock") ? KeyMode.ENABLED : KeyMode.DISABLED;
		return keyItem;
	}

	public equal(templateEventItem: KeyItem): boolean {
		var response = this.key === templateEventItem.key;
		if (templateEventItem.ctrMode !== KeyMode.IGNORED) {
			response = response && this.ctrMode == templateEventItem.ctrMode;
		}
		if (templateEventItem.shiftMode !== KeyMode.IGNORED) {
			response = response && this.shiftMode == templateEventItem.shiftMode;
		}
		if (templateEventItem.altMode !== KeyMode.IGNORED) {
			response = response && this.altMode == templateEventItem.altMode;
		}
		if (templateEventItem.numlockMode !== KeyMode.IGNORED) {
			response = response && this.numlockMode == templateEventItem.numlockMode;
		}
		return response;
	}
}

export enum KeyboardKey {
	b = "b",
	i = "i",
	u = "u",
	s = "s",
	o = "o",
	v = "v",
	x = "x",
	z = "z",
	Control = "Control",
	Shift = "Shift",
	Alt = "Alt",
	ScrollLock = "ScrollLock",
	Meta = "Meta",
	ContextMenu = "ContextMenu",
	NumLock = "NumLock",
	PageUp = "PageUp",
	PageDown = "PageDown",
	Clear = "Clear",
	Insert = "Insert",
	Pause = "Pause",
	Tab = "Tab",
	CapsLock = "CapsLock",
	ArrowLeft = "ArrowLeft",
	ArrowRight = "ArrowRight",
	ArrowUp = "ArrowUp",
	ArrowDown = "ArrowDown",
	End = "End",
	Home = "Home",
	F1 = "F1",
	F2 = "F2",
	F3 = "F3",
	F4 = "F4",
	F5 = "F5",
	F6 = "F6",
	F7 = "F7",
	F8 = "F8",
	F9 = "F9",
	F10 = "F10",
	F11 = "F11",
	F12 = "F12",
	Delete = "Delete",
	Backspace = "Backspace",
	BracketOpen = "(",
	BracketClose = ")",
	Add = "+",
	Subtract = "-",
	Divide = "/",
	Multiply = "*",
	Greater = ">",
	Less = "<",
	Equal = "=",
	Not = "!",
	AtSign = "@",
}


export class KeyManager {
	private _deniedKeys: KeyItem[] = [
		new KeyItem(KeyboardKey.b, KeyMode.ENABLED),
		new KeyItem(KeyboardKey.i, KeyMode.ENABLED),
		new KeyItem(KeyboardKey.u, KeyMode.ENABLED),
		new KeyItem(KeyboardKey.z, KeyMode.ENABLED),
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

		new KeyItem(KeyboardKey.o, KeyMode.ENABLED),
		new KeyItem(KeyboardKey.s, KeyMode.ENABLED),
		new KeyItem(KeyboardKey.x, KeyMode.ENABLED),
		new KeyItem(KeyboardKey.v, KeyMode.ENABLED),
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
		new KeyItem(KeyboardKey.AtSign, KeyMode.IGNORED, KeyMode.IGNORED, KeyMode.ENABLED),
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

	public isSingleOperationKey(keyItem: KeyItem): boolean {
		return this.isMathKey(keyItem) ||
			this.isBracketKey(keyItem) ||
			this.isConditionKey(keyItem);
	}

	public isCommandKey(keyItem: KeyItem): boolean {
		return this.has(keyItem, this._commandKeys);
	}
}

