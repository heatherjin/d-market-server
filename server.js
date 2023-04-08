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
const detectProduct = require("./helpers/detectProduct");
const product = require("./models/product");
const port = 8080;

// json형식의 데이터 처리할수 있도록 코드 작성
//json形式のデータ処理ができるようにコード作成
app.use(express.json());
// 모든 브라우저에서 서버 요청 가능
// すべてのブラウザでサーバーリクエストが可能
app.use(cors());
//해당 파일을 보여줄 때 입력했던 경로로 보여주기 위해 셋팅
//該当ファイルを表示する際に入力したパスで表示するためのセッティング
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
      res.status(500).send("エラーが発生しました。");
    });
});

app.get("/products", (req, res) => {
  const { Op } = require('sequelize');
  const search = req.query.q;

  const page = Number(req.query.page) || 1; // default 1
  const pageSize = Number(req.query.limit) || 10; // default 10

   
  //Op.like: Sequelize에서 제공하는 연산자, 해당 컬럼이 지정한 값과 유사한 값을 가지는 레코드를 검색(search를 포함한 레코드 검색)
  //Op.like:Sequelizeが提供する演算子、当該カラムが指定した値と類似した値を持つレコードを検索(searchを含むレコード検索)
  const where = search ? { name: { [Op.like]: `%${search}%` } } : {};

   //검색조건이 있거나, 없을 경우 둘다 세기
   //検索条件があるか、ない場合は両方とも数える
  models.Product.count({ where })
  .then((count) => {
    // 총 페이지 수 계산
    //総ページ数の計算
    const totalPages = Math.ceil(count / pageSize); 

    return models.Product.findAll({
      //個数制限·ページネーション等に使用
      limit: pageSize,
      offset: (page - 1) * pageSize,
      where,
      order: [["createdAt", "DESC"]],
      attributes: [
        "id",
        "name",
        "price",
        "createdAt",
        "seller",
        "imageUrl",
        "soldout",
        "password",
        "phone",
      ],
    })
      .then((result) => {
        console.log("Products:", result);
        res.send({
          products: result,
          //총 페이지 수 응답
          // 総ページ数応答
          totalPages, 
        });
      })
      .catch((err) => {
        console.error(err);
        res.status(400).send("エラーが発生しました。");
      });
  });
});


app.post("/products", (req, res) => {
  const body = req.body;
  const { name, description, price, seller, imageUrl, password, phone } = body;
  if (!name || !description || !price || !seller || !imageUrl || !password || !phone) {
    //방어코드
    //防御コード
    res.status(400).send("すべてのフィールドを入力してください。");
  }
  detectProduct(imageUrl, (type) => {
    models.Product.create({
      name,
      description,
      price,
      seller,
      imageUrl,
      password,
      phone,
      type
    })
      .then((result) => {
        console.log("商品生成結果 : ", result);
        res.send({
          result,
        });
      })
      .catch((err) => {
        console.error(err);
        res.status(400).send("商品のアップロードに問題が発生しました。");
      });
  }) 

});

app.get("/products/:id", (req, res) => {
  const params = req.params;
  const { id } = params;

  models.Product.findOne({
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
      res.status(400).send("商品照会にエラーが発生しました。");
    });
});


app.put("/products/:id", (req, res) => {
  const params = req.params;
  const { id } = params;
  const body = req.body;
  const { name, description, price, seller, imageUrl, soldout, password, phone } = body;

  if (!name || !description || !price || !seller || !imageUrl || !soldout || !password || !phone ) {

    res.status(400).send("すべてのフィールドを入力してください。");
  }

  models.Product.update(
    { name, description, seller, price, imageUrl, soldout, password, phone },
    { where: { id } }
    )
    .then(() => {
      models.Product.findOne({ where: { id } })
        .then((result) => {
          console.log("UPDATED PRODUCT:", result);
          res.send({ product: result });
        })
        .catch((err) => {
          console.error(err);
          res.status(400).send("商品照会にエラーが発生しました。");
        });
    })
    .catch((err) => {
      console.error(err);
      res.status(400).send("商品の修正にエラーが発生しました。");
    });
});


app.delete("/products/:id", (req, res) => {
  const params = req.params;
  const { id } = params;
  models.Product.findOne({
    where: {
      id,
    },
  })
    .then((result) => {     
      //DB정보 삭제 
      //DB情報の削除
      models.Product.destroy({ 
        where: { id,
        },
      })
        .then(() => {
          res.send({
            result: true,
          });
        })
        .catch((err) => {
          console.error(err);
          res.status(500).send("エラーが発生しました。");
        });  
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("エラーが発生しました。");
    });
});

//한개의 파일을 보냈을 때/image를 키로 설정
//1つのファイルを送信したとき/imageをキーに設定
app.post("/image", upload.single("image"), (req, res) => {
  //저장된 이미지 파일 정보 얻기
  //保存された画像ファイル情報を取得
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
      res.status(500).send("エラーが発生しました。");
    });
});


app.get("/products/:id/recommendation", (req, res) => {
  const { id } = req.params;
  models.Product.findOne({
    where: {
      id,
    },
  })
    .then((product) => {
      const type = product.type;
      models.Product.findAll({
        where: {
          type,
          id: {
            [models.Sequelize.Op.ne]: id,
          },
        },
      }).then((products) => {
        res.send({
          products,
        });
      });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("エラーが発生しました。");
    });
});

app.listen(port, () => {
  console.log("d-marketのショッピングモールサーバーが稼働しています。");
  //DB동기화, sync는 모델스의 테이블정보를 싱크하겠다는 의미
  //DB同期、syncはモデルズのテーブル情報をシンクするという意味
  models.sequelize
    .sync()
    .then(() => {
      console.log("DB接続成功！");
    })
    .catch((err) => {
      console.error(err);
      console.log("DB接続エラー");
      //DB연결 실패 시 종료
      //DB接続失敗時に終了
      process.exit();
    });
});




