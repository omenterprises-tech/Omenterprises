import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

async function main() {
  const urls = [
    "https://res.cloudinary.com/qyrnkbwo/image/upload/v1787591000/om_enterprises/vms0jlvauom7nupesvyd.jpg",
    "https://res.cloudinary.com/qyrnkbwo/image/upload/v1787591011/om_enterprises/fsyqe9eph5iihklj05vw.jpg"
  ];

  for (const url of urls) {
    const res = await fetch(url, { method: "HEAD" });
    console.log(url, "-> size:", res.headers.get("content-length"));
  }
}

main();
