import { Message } from "../types/message.types";

export interface Command {
  name: string;
  description: string;
  execute: (message: Message, args: string[]) => Promise<void>;
}

const commands = new Map<string, Command>();

export function registerCommand(command: Command) {
  commands.set(command.name, command);
}

export function getCommand(name: string): Command | undefined {
  return commands.get(name);
}

export function getAllCommands(): Command[] {
  return Array.from(commands.values());
}
