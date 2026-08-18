import { seedBranches } from "../src/data/seed-branches";

const byId = new Map(seedBranches.map((b) => [b.id, b]));
let problems = 0;

// 1. Duplicate IDs
const seen = new Set<string>();
for (const b of seedBranches) {
  if (seen.has(b.id)) {
    console.log(`DUPLICATE ID: ${b.id}`);
    problems++;
  }
  seen.add(b.id);
}

// 2. Dangling nextBranchIds references
for (const b of seedBranches) {
  for (const nextId of b.nextBranchIds) {
    if (!byId.has(nextId)) {
      console.log(`DANGLING REF: ${b.id} -> ${nextId} (does not exist)`);
      problems++;
    }
  }
}

// 3. Reachability from roots
const roots = seedBranches.filter((b) => b.isRoot).map((b) => b.id);
const reachable = new Set<string>();
const queue = [...roots];
while (queue.length) {
  const id = queue.shift()!;
  if (reachable.has(id)) continue;
  reachable.add(id);
  const b = byId.get(id);
  if (!b) continue;
  for (const nextId of b.nextBranchIds) queue.push(nextId);
}
const unreachable = seedBranches.filter((b) => !reachable.has(b.id));
if (unreachable.length > 0) {
  console.log(`UNREACHABLE (${unreachable.length}):`);
  for (const b of unreachable) console.log(`  ${b.id} — "${b.title}"`);
  problems += unreachable.length;
}

// 4. Leaf nodes with a type that doesn't read as a sensible ending
const OK_LEAF_TYPES = new Set(["SUCCESS", "EXIT", "CALLBACK"]);
const leaves = seedBranches.filter((b) => b.nextBranchIds.length === 0);
const suspiciousLeaves = leaves.filter((b) => !OK_LEAF_TYPES.has(b.type));
console.log(`\nTotal branches: ${seedBranches.length}`);
console.log(`Total leaves (dead ends): ${leaves.length}`);
if (suspiciousLeaves.length > 0) {
  console.log(`SUSPICIOUS LEAVES (dead-end but not SUCCESS/EXIT/CALLBACK) (${suspiciousLeaves.length}):`);
  for (const b of suspiciousLeaves) console.log(`  ${b.id} [${b.type}] — "${b.title}": "${b.responseText}"`);
}

console.log(`\n${problems === 0 ? "PASS" : `FAIL (${problems} problems)`}`);
process.exit(problems === 0 ? 0 : 1);
