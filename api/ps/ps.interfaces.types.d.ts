import { Request } from "express";

export interface ExtendedReq extends Request {
  keys: string[];
  key: string;
}
