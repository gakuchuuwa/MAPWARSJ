const fs = require('fs');

let content = fs.readFileSync('AGENTS.md', 'utf-8');

const warning = `> **⚠️ 绝对禁止使用 GIT 回滚（极其重要，全优先执行）⚠️**
> **严禁任何 AI 在终端中使用 \`git checkout\`、\`git restore\`、\`git clean\` 或 \`git reset\` 等任何具有覆盖/回滚工作区文件破坏性效果的 Git 命令！**
> 玩家的 Git 处于不可用或极其陈旧的备份状态，本地保存着大量长达数天心血的未提交（uncommitted）修改。
> 任何试图使用 Git 命令进行回滚、恢复的操作，都会导致玩家几天的手工心血瞬间白费！
> 如果 AI 修改代码失误，必须通过**精确的脚本重写或手动修改**来修复，**绝不允许试图用 Git 回滚**。违反此规则 = 销毁用户心血，是本项目的绝对红线！\n\n`;

content = content.replace('---', warning + '---');

fs.writeFileSync('AGENTS.md', content, 'utf-8');
console.log('Successfully added the warning to the top of AGENTS.md');
