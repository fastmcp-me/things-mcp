export class Logger {
  private context: string;
  
  constructor(context: string) {
    this.context = context;
  }
  
  private log(level: string, message: string, data?: any): void {
    // MCP servers should log to stderr
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      ...(data && { data })
    }));
  }
  
  info(message: string, data?: any): void {
    this.log('info', message, data);
  }
  
  error(message: string, data?: any): void {
    this.log('error', message, data);
  }
  
  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }
  
  debug(message: string, data?: any): void {
    if (process.env.DEBUG) {
      this.log('debug', message, data);
    }
  }
}

export const logger = new Logger('things-mcp');