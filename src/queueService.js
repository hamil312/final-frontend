require('dotenv').config();
const AWS = require('aws-sdk');

AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const sqs = new AWS.SQS();
const queueUrl = process.env.SQS_QUEUE_URL;

async function sendToQueue(user) {
  const params = {
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(user),
  };

  try {
    const data = await sqs.sendMessage(params).promise();
    console.log("Mensaje enviado a SQS:", data.MessageId);
  } catch (error) {
    console.error("Error al enviar mensaje a SQS:", error.message);
  }
}

module.exports = { sendToQueue };