process.parentPort.on("message", (event) => {
  console.log("Received message from parent:", event);
});
