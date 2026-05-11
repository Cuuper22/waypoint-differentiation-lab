import { buildTeacherPacket, reviewerWorkflowMarkdown } from "./generator.js";

const packet = buildTeacherPacket({ minutesAvailable: 15, emphasis: "balanced" });

console.log(reviewerWorkflowMarkdown(packet));
