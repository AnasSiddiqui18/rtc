import { DefaultEventsMap, Server } from "socket.io";

export type IO = Server<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  any
>;
