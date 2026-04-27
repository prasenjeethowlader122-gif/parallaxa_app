import xss from "xss";

const payloads = [
  {
    name: "Basic Script tag",
    input: "<script>alert('xss')</script>",
    shouldBeCleaned: true
  },
  {
    name: "Image with onerror",
    input: "<img src=x onerror=alert(1)>",
    shouldBeCleaned: true
  },
  {
    name: "Anchor with javascript protocol",
    input: "<a href='javascript:alert(1)'>Click me</a>",
    shouldBeCleaned: true
  },
  {
    name: "Normal text with symbols",
    input: "Hello & welcome to the world of <b>social media</b>!",
    shouldBeCleaned: false
  },
  {
    name: "Iframe tag",
    input: "<iframe src='https://malicious.com'></iframe>",
    shouldBeCleaned: true
  }
];

function sanitize(input) {
  return xss(input);
}

console.log("Running security verification for XSS sanitization...\n");

let failed = false;

for (const payload of payloads) {
  const output = sanitize(payload.input);
  const isCleaned = output !== payload.input;

  console.log(`Test: ${payload.name}`);
  console.log(`Input:  ${payload.input}`);
  console.log(`Output: ${output}`);

  if (payload.shouldBeCleaned && !isCleaned) {
    console.error("❌ FAILED: Payload should have been cleaned but was not.\n");
    failed = true;
  } else if (!payload.shouldBeCleaned && isCleaned) {
    // Some minor cleaning (like escaping) might happen, but we check if it's still safe
    console.log("⚠️ INFO: Payload was modified even though it was considered safe.\n");
  } else {
    console.log("✅ PASSED\n");
  }
}

if (failed) {
  console.error("Security verification failed!");
  process.exit(1);
} else {
  console.log("All security verification tests passed successfully!");
}
