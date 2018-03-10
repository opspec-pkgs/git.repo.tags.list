const nodegit = require('nodegit');
const fs = require('fs');
const process = require('process');

/**
* Constructs a tagger object in the format we want
* @param {Object} nodeGitTagger a node git Signature object
*/
const constructTime = nodeGitTime => ({
  offset: nodeGitTime.offset(),
  time: nodeGitTime.time(),
});

/**
 * Constructs a tagger object in the format we want
 * @param {Object} nodeGitTagger a node git Signature object
 */
const constructSignature = nodeGitSignature => ({
  name: nodeGitSignature.name(),
  email: nodeGitSignature.email(),
  when: constructTime(nodeGitSignature.when()),
});

/**
 * Constructs a tag object in the format we want
 * @param {Object} repo 
 * @param {String} tagName 
 */
const constructTag = async (repo, tagName) => {
  try {
    const tag = await repo.getTagByName(tagName);

    return {
      objectId: tag.id().tostrS(),
      name: tag.name(),
      tagger: constructSignature(tag.tagger()),
      message: tag.message(),
      targetObjectId: tag.targetId().tostrS(),
    };
  } catch (err) {
    // @TODO remove this gross error swallowing when https://github.com/nodegit/nodegit/issues/1311 is changed (hopefully).
    // until then, no way to know if "lightweight" or "annotated" tag, and this call fails for lightweight.
    const ref = await repo.getReference(`refs/tags/${tagName}`);
    return {
      name: tagName,
      targetObjectId: ref.target().tostrS(),
    };
  }
}

const listTags = async () => {
  const repo = await nodegit.Repository.open('/');
  const tags = await nodegit.Tag.list(repo);
  return await Promise.all(tags.map(tag => constructTag(repo, tag)));
}

listTags()
  .then(tags => fs.writeFileSync('/tags', JSON.stringify(tags)))
  .catch(err => {
    console.log(err.message);
    process.exit(1);
  })