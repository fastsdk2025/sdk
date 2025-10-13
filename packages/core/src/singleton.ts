type Constructor<T = any> = new (...args: any[]) => T

export function singleton<T extends Constructor>(constructor: T) {
  type Instance = InstanceType<T>
  let instance: Instance | null = null

  // 构造函数代理，拦截 new
  const proxy = new Proxy(constructor, {
    construct(target, args, newTarget) {
      if (instance) return instance
      instance = Reflect.construct(target, args, newTarget)
      Object.defineProperty(instance, "constructor", {
        value: proxy,
        writable: false,
        enumerable: false,
        configurable: false,
      })
      return instance as object
    },
  })

  // 给 proxy 添加静态 getInstance 方法
  const extended = proxy as T & {
    getInstance: (...args: ConstructorParameters<T>) => Instance
  }

  extended.getInstance = (...args: ConstructorParameters<T>) =>
    instance ?? new extended(...args)

  return extended
}
