import Kernel from "./Kernel";

export default abstract class Service {
  constructor(protected kernel: Kernel) { }
  public onRegister?(): void;
  public onInit?(): void;
  public onDestroy?(): void;
}
