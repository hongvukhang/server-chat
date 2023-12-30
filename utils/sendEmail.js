const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  // config mail server
  service: "Gmail",
  auth: {
    user: "hongvukhang1@gmail.com",
    pass: "vvlm lpxg oyhg wsth",
  },
});
exports.sendEmail = async (email, otp, subject) => {
  console.log(email);
  const mainOptions = {
    // thiết lập đối tượng, nội dung gửi mail
    from: "hongvukhang1@gmail.com",
    to: email,
    subject: subject, //"Register Email"
    text: subject,
    html: `<style>
           body {
             display: flex;
             justify-content: center;
             align-items: center;
             flex-direction: column;
             width: 100%;
           }
           .title {
             width: 100%;
             text-align: center;

             background-image: linear-gradient(
               348deg,
               rgb(157, 4, 251),
               rgb(166, 105, 250),
               rgb(105, 52, 246)
             );
           }
           h3 {
             font-size: 30px;
             font-weight: 600;
             font-family: cursive;
             cursor: pointer;
           }
         </style>
         <div class="title">
           <h3>Message</h3>
         </div>
         <div>
           <p>Email: ${email}</p>
           <p>Mã OTP: ${otp}</p>
           <p style="font-style: italic; color: red">Mã OTP tồn tại trong 2 phút</p>
         </div>`,
  };

  const info = await transporter.sendMail(mainOptions);

  return info;
};
