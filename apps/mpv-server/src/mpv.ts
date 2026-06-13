import child_process from "child_process";
import { EventEmitter } from "events";
import net from "net";
import type Stream from "stream";

export class MPV extends EventEmitter {
  private binaryPath: string;
  private socketPath: string;
  private mpvProcess: child_process.ChildProcessByStdio<
    null,
    null,
    Stream.Readable
  > | null;
  private ipcClient: net.Socket | null;

  constructor() {
    super();
    this.binaryPath = process.env.MPV_BINARY_PATH || "/usr/bin/mpv";
    this.socketPath = process.env.MPV_SOCKET_PATH || "/tmp/mpv.sock";
    this.mpvProcess = null;
    this.ipcClient = null;
  }

  private spawnMPV() {
    console.log(
      `Starting MPV process with binary: ${this.binaryPath} and socket: ${this.socketPath}`,
    );
    this.mpvProcess = child_process.spawn(
      this.binaryPath,
      ["--idle=yes", "--input-ipc-server=" + this.socketPath],
      {
        stdio: ["ignore", "ignore", "pipe"],
      },
    );
    this.mpvProcess.on("error", (err) => {
      console.error(`Failed to start MPV process: ${err}`);
      process.exit(1);
    });
    this.mpvProcess.on("close", (code) => {
      console.log(`MPV process exited with code ${code}, restarting...`);
      this.emit("data", JSON.stringify({ event: "mpv-server:exited", code }));
      this.start();
    });
    this.mpvProcess.stderr.on("data", (data) => {
      process.stderr.write(`[MPV stderr] ${data}`);
    });
  }

  private connectToMPV() {
    console.log(`Connecting to MPV IPC socket at ${this.socketPath}...`);
    return new Promise<void>((resolve, reject) => {
      const client = net.createConnection(this.socketPath, () => {
        console.log(`Connected to MPV IPC socket at ${this.socketPath}`);
        this.ipcClient = client;
        this.emit("data", JSON.stringify({ event: "mpv-server:connected" }));
        resolve();
      });
      client.on("data", (data) => {
        this.emit("data", data);
      });
      client.on("error", (err) => {
        console.error(`[MPV IPC error] ${err}`);
        reject(err);
      });
    });
  }

  async start() {
    this.spawnMPV();
    await new Promise((res) => setTimeout(res, 500));
    for (let i = 0; i < 10; i++) {
      try {
        await this.connectToMPV();
        return;
      } catch {
        console.error(
          `Failed to connect to MPV IPC socket, retrying... (${i + 1}/10)`,
        );
        await new Promise((res) => setTimeout(res, 1000));
      }
    }
    throw new Error("Failed to connect to MPV IPC socket after 10 attempts");
  }

  sendCommand(command: string) {
    if (!this.ipcClient) {
      throw new Error("Not connected to MPV IPC socket");
    }
    this.ipcClient.write(command);
  }

  async stop() {
    if (this.ipcClient) {
      await new Promise<void>((resolve) => this.ipcClient!.end(resolve));
      this.ipcClient = null;
      console.log("Disconnected from MPV IPC socket");
    }
    if (this.mpvProcess) {
      this.mpvProcess.removeAllListeners();
      this.mpvProcess.kill();
      this.mpvProcess = null;
      console.log("MPV process stopped");
    }
  }
}
