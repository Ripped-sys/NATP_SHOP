export interface ReturnVO<T> {
  code: number;
  msg: string;
  content?: T;
}
