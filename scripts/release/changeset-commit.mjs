export default {
    getAddMessage(changeset) {
        return `docs(changeset): 记录版本变更\n\n${changeset.summary}`;
    },

    getVersionMessage(releasePlan) {
        const releases = releasePlan.releases
            .filter(release => release.type !== 'none')
            .map(release => `- ${release.name}@${release.newVersion}`);

        return `chore(release): 更新工作区版本\n\n版本清单：\n${releases.join('\n')}`;
    },
};
