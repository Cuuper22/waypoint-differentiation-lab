import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildTeacherPacket,
  evidenceAuditMarkdown,
  showcaseData,
  teacherHandoutMarkdown
} from "./generator.js";

const packet = buildTeacherPacket({ minutesAvailable: 45, emphasis: "full-support" });
const examplesDir = join(process.cwd(), "examples");
const showcaseSrcDir = join(process.cwd(), "showcase", "src");

mkdirSync(examplesDir, { recursive: true });
mkdirSync(showcaseSrcDir, { recursive: true });

writeFileSync(join(examplesDir, "sample-packet.json"), `${JSON.stringify(packet, null, 2)}\n`);
writeFileSync(join(examplesDir, "teacher-handout.md"), `${teacherHandoutMarkdown(packet)}\n`);
writeFileSync(join(examplesDir, "evidence-audit.md"), `${evidenceAuditMarkdown(packet)}\n`);
writeFileSync(join(examplesDir, "quality-report.json"), `${JSON.stringify(packet.qualityReport, null, 2)}\n`);
writeFileSync(
  join(showcaseSrcDir, "generated-data.js"),
  `export const data = ${JSON.stringify(showcaseData(packet), null, 2)};\n`
);

console.log(
  JSON.stringify(
    {
      wrote: [
        "examples/sample-packet.json",
        "examples/teacher-handout.md",
        "examples/evidence-audit.md",
        "examples/quality-report.json",
        "showcase/src/generated-data.js"
      ],
      modifications: packet.modifications.length,
      qualityPassed: packet.qualityReport.passed
    },
    null,
    2
  )
);
