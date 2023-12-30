const firebase = require("../firebase/firebase");

exports.upload = async (file) => {
  const blob = firebase.bucket.file(file.originalname + new Date());
  const blobWriter = blob.createWriteStream({
    metadata: {
      contentType: file.mimetype,
    },
  });
  blobWriter.on("error", (err) => {
    console.log("run");
    console.log(err);
  });
  blobWriter.on("finish", () => {});
  blobWriter.end(file.buffer);

  const [url] = await firebase.bucket
    .file(file.originalname + new Date())
    .getSignedUrl({
      version: "v2",
      action: "read",
      expires: Date.now() + 1000 * 60 * 60 * 24 * 30 * 12 * 2,
    });
  return url;
};
exports.generateSignedUrl = async (filename) => {
  const options = {
    version: "v2",
    action: "read",
    expires: Date.now() + 1000 * 60 * 60,
  };

  const [url] = await firebase.bucket.file(filename).getSignedUrl(options);
  return url;
};
