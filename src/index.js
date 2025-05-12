const AWS = require("aws-sdk");
const ses = new AWS.SES();

exports.handler = async (event) => {
  for (const record of event.Records) {
    const user = JSON.parse(record.body);

    const params = {
      Destination: {
        ToAddresses: [user.email],
      },
      Message: {
        Body: {
          Text: { Data: `Hola ${user.name}, gracias por registrarte.` },
        },
        Subject: { Data: "¡Bienvenido!" },
      },
      Source: "hamisan36@gmail.com",
    };

    try {
      await ses.sendEmail(params).promise();
      console.log("Correo enviado a", user.email);
    } catch (err) {
      console.error("Error al enviar correo:", err.message);
    }
  }
};