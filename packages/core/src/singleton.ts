export function singleton<T extends { new(...args: unknown[]): {} }>(
	classType: T
) {
	let instance: InstanceType<T> | null = null;

	const proxy = new Proxy(classType, {
		construct(target: T, args: unknown[], newTarget: Function) {
			if (instance) {
				return instance
			}

			instance = Reflect.construct(target, args, newTarget)

			Object.defineProperty(instance, "constructor", {
				value: proxy,
				writable: false,
				configurable: false
			})

			return instance as InstanceType<T>
		}
	})

	return proxy
}