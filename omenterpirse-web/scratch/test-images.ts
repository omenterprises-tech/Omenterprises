import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

async function main() {
  const urls = [
    "https://res.cloudinary.com/qyrnkbwo/image/upload/v1787591504/om_enterprises/bvpvxeckahvgro4aivnu.jpg",
    "https://res.cloudinary.com/qyrnkbwo/image/upload/v1787591510/om_enterprises/l9fjnd7lmusevaqgshfm.jpg"
  ];

  for (const url of urls) {
    const res = await fetch(url, { method: "HEAD" });
    console.log(url, "-> size:", res.headers.get("content-length"));
  }
}

main();
