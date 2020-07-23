require("isomorphic-unfetch");
const { argv } = require("yargs");
const chalk = require("chalk");

const Client = require("./modules/ws/client");

console.log(chalk.bold.blue("PaperPlane Tunnel CLI v1.1"));
const port = argv.port;
const baseUrl = argv.host || "tunnel.paperplane.ml:50002";
const protocol = argv.protocol || "http";
const wsUrl = argv.sockets || "ws://tunnel.paperplane.ml:10002";

if (port === undefined || typeof port !== "number") {
  console.log(chalk.bold("USAGE:"));
  console.log("  --port");
  console.log("      Port number to proxy");
  console.log("  --host");
  console.log("      Host of the pptunnel server");
  console.log("  --protocol");
  console.log("      Protocol used to connect to the pptunnel server");
  console.log("  --sockets");
  console.log("      Host of the pptunnel sockets");
  console.log();
  console.log(chalk.bold("EXAMPLE:"));
  console.log(
    "  ./pptnl --port 3000 --host tunnel.paperplane.ml:50002 --protocol http --sockets tunnel.paperplane.ml:10002"
  );
} else {
  console.log(`Proxying :${port}`);

  fetch(`${protocol}://${baseUrl}`, {
    method: "POST",
  })
    .then((res) => res.json())
    .then((res) => {
      const { sub, key } = res;
      const PORT = Number(res.port);

      const client = new Client();
      client.start(PORT, wsUrl, `localhost:${port}`);

      console.log(chalk.green(`Proxy available on http://${sub}.${baseUrl}`));

      const kill = async () => {
        console.log();
        console.log(chalk.bold.red("Cleaning Up"));
        await fetch(`${protocol}://${baseUrl}`, {
          method: "DELETE",
          body: JSON.stringify({
            sub,
            key,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }).then(() => {
          console.log(chalk.bold.red("Exitted"));
          process.exit();
        });
      };

      process.on("SIGINT", () => {
        setTimeout(process.exit, 5000);
        kill();
      });

      process.on("SIGTERM", () => {
        setTimeout(process.exit, 5000);
        kill();
      });
    });
}
