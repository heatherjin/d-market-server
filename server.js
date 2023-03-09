const express = require("express");
const cors = require("cors");
const app = express();
const models = require("./models");
const multer = require("multer");
upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },  
  }),
});
const port = 8080;

// json형식의 데이터 처리할수 있도록 코드 작성
app.use(express.json());
// 모든 브라우저에서 서버 요청 가능
app.use(cors());
//해당 파일을 보여줄 때 입력했던 경로로 보여주기 위해  셋팅
app.use("/uploads", express.static("uploads"));


app.get("/banners", (req, res) => {
  models.Banner.findAll({
    limit: 2,
  })
    .then((result) => {
      res.send({
        banners: result,
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("에러가 발생했습니다.");
    });
});

app.get("/products", (req, res) => {
  const { Op } = require('sequelize');
  const search = req.query.q;

  const page = Number(req.query.page) || 1; // 기본값 1
  const pageSize = Number(req.query.limit) || 10; // 기본값 8

   
  //Op.like: Sequelize에서 제공하는 연산자, 해당 컬럼이 지정한 값과 유사한 값을 가지는 레코드를 검색(search를 포함한 레코드 검색)
  const where = search ? { name: { [Op.like]: `%${search}%` } } : {};

   //검색조건이 있거나, 없을 경우 둘다 세기
  models.Product.count({ where })
  .then((count) => {
    const totalPages = Math.ceil(count / pageSize); // 총 페이지 수 계산

    // 상품 조회
    return models.Product.findAll({
      //갯수 제한, 페이지네이션 등에 쓰임
      limit: pageSize,
      offset: (page - 1) * pageSize,
      //where 등을 써서 조건 정할 수 있음
      //order by
      where,
      order: [["createdAt", "DESC"]],
      //어떤 컬럼을 가져올건지(기본값:전체 컬럼을 가져옴)
      attributes: [
        "id",
        "name",
        "price",
        "createdAt",
        "seller",
        "imageUrl",
        "soldout",
      ],
    })
      .then((result) => {
        console.log("Products:", result);
        res.send({
          products: result,
          totalPages, // 총 페이지 수 응답
        });
      })
      .catch((err) => {
        console.error(err);
        res.status(400).send("에러 발생");
      });
  });
});

// /products 경로로 post요청이 왔을 때 아래 코드가 실행됨
app.post("/products", (req, res) => {
  const body = req.body;
  const { name, description, price, seller, imageUrl } = body;
  if (!name || !description || !price || !seller || !imageUrl) {
    //방어코드
    res.status(400).send("모든 필드를 입력해주세요");
  }
  models.Product.create({
    name,
    description,
    price,
    seller,
    imageUrl,
  })
    .then((result) => {
      console.log("상품 생성 결과 : ", result);
      res.send({
        result,
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(400).send("상품 업로드에 문제가 발생했습니다.");
    });
});

app.get("/products/:id", (req, res) => {
  const params = req.params;
  const { id } = params;
  models.Product.findOne({
    //조건,설정
    where: {
      id: id,
    },
  })
    .then((result) => {
      console.log("PRODUCT:", result);
      res.send({
        product: result,
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(400).send("상품 조회에 에러가 발생했습니다.");
    });
});

//한개의 파일을 보냈을 때/image를 키로 설정
app.post("/image", upload.single("image"), (req, res) => {
  //저장된 이미지 파일 정보 얻기
  const file = req.file;
  console.log(file);
  res.send({
    imageUrl: file.path,
  });
});

app.post("/purchase/:id", (req, res) => {
  const { id } = req.params;
  models.Product.update(
    {
      soldout: 1,
    },
    {
      where: {
        id,
      },
    }
  )
    .then((result) => {
      res.send({
        result: true,
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("에러가 발생했습니다.");
    });
});

app.listen(port, () => {
  console.log("d-market의 쇼핑몰 서버가 돌아가고 있습니다.");
  //DB동기화, sync는 모델스의 테이블정보를 싱크하겠다는 의미
  models.sequelize
    .sync()
    .then(() => {
      console.log("DB연결 성공!");
    })
    .catch((err) => {
      console.error(err);
      console.log("DB연결 에러ㅠ");
      //DB연결 실패 시 종료
      process.exit();
    });
});

//상품 조회 API









