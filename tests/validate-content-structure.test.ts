import { describe, it, expect } from "vitest";
import { checkEntryStructure } from "../scripts/validate-content";

const goodBody = `
<p class="section-eyebrow">§ 1 · Premise</p>
## Premise
${"line\n".repeat(45)}
See [other paper](https://arxiv.org/abs/2305.13245).

<p class="section-eyebrow">§ 2 · Derivation</p>
## Derivation
${"line\n".repeat(90)}
$$a = b$$

$$c = d$$

$$e = f$$

<p class="section-eyebrow">§ 3 · Reference implementation</p>
## Reference implementation
${"line\n".repeat(25)}
\`\`\`python
def x(): pass
\`\`\`

<p class="section-eyebrow">§ 4 · Empirical evidence</p>
## Empirical evidence
${"line\n".repeat(50)}
See [another paper](https://arxiv.org/abs/2407.21783) Table 1.
`;

const SELF_URL = "https://arxiv.org/abs/2401.00001";

describe("checkEntryStructure", () => {
  it("accepts a well-formed entry", () => {
    const issues = checkEntryStructure(goodBody, SELF_URL);
    expect(issues).toEqual([]);
  });

  it("flags missing § 2 Derivation", () => {
    const body = goodBody.replace(/§ 2 · Derivation/, "§ 2 · Something Else");
    const issues = checkEntryStructure(body, SELF_URL);
    expect(issues.some((i) => i.message.includes("§ 2"))).toBe(true);
  });

  it("flags derivation with < 3 display equations", () => {
    const body = goodBody.replace(/\$\$c = d\$\$\s*\$\$e = f\$\$/, "");
    const issues = checkEntryStructure(body, SELF_URL);
    expect(issues.some((i) => i.message.includes("display equation"))).toBe(true);
  });

  it("flags § 4 with no non-self citation", () => {
    const body = goodBody.replace("https://arxiv.org/abs/2407.21783", "https://arxiv.org/abs/2401.00001");
    const issues = checkEntryStructure(body, SELF_URL);
    expect(issues.some((i) => i.message.includes("non-original"))).toBe(true);
  });

  it("flags body line count below 200", () => {
    const issues = checkEntryStructure("tiny\n", SELF_URL);
    expect(issues.some((i) => i.message.includes("line count"))).toBe(true);
  });
});
