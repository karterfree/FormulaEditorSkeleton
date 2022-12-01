import { KeyUsageMode } from "../enums/key-usage-mode.enum";

export class KeyItem {
	key: string = '';
	ctrMode: KeyUsageMode;
	altMode: KeyUsageMode;
	shiftMode: KeyUsageMode;
	numlockMode: KeyUsageMode;

	constructor(key: string, 
		ctrMode: KeyUsageMode = KeyUsageMode.IGNORED,
		altMode: KeyUsageMode = KeyUsageMode.IGNORED,
		shiftMode: KeyUsageMode = KeyUsageMode.IGNORED,
		numlockMode: KeyUsageMode = KeyUsageMode.IGNORED) {
		this.key = key;
		this.ctrMode = ctrMode;
		this.altMode = altMode;
		this.shiftMode = shiftMode;
		this.numlockMode = numlockMode;
	}

	static fromKeyboardEvent(event: KeyboardEvent): KeyItem {
		var keyItem = new KeyItem(event.key);
		keyItem.ctrMode = event.ctrlKey ? KeyUsageMode.ENABLED : KeyUsageMode.DISABLED;
		keyItem.altMode = event.altKey ? KeyUsageMode.ENABLED : KeyUsageMode.DISABLED;
		keyItem.shiftMode = event.shiftKey ? KeyUsageMode.ENABLED : KeyUsageMode.DISABLED;
		keyItem.numlockMode = event.getModifierState("NumLock") ? KeyUsageMode.ENABLED : KeyUsageMode.DISABLED;
		return keyItem;
	}

	public equal(templateEventItem: KeyItem): boolean {
		var response = this.key === templateEventItem.key;
		if (templateEventItem.ctrMode !== KeyUsageMode.IGNORED) {
			response = response && this.ctrMode == templateEventItem.ctrMode;
		}
		if (templateEventItem.shiftMode !== KeyUsageMode.IGNORED) {
			response = response && this.shiftMode == templateEventItem.shiftMode;
		}
		if (templateEventItem.altMode !== KeyUsageMode.IGNORED) {
			response = response && this.altMode == templateEventItem.altMode;
		}
		if (templateEventItem.numlockMode !== KeyUsageMode.IGNORED) {
			response = response && this.numlockMode == templateEventItem.numlockMode;
		}
		return response;
	}
}