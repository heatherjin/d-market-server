module.exports = function (sequelize, DataTypes) {
  //테이블명 'Product', 컬럼 정의
  // テーブル名 'Product'、カラム定義
  const product = sequelize.define("Product", {
    name: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    price: {
      type: DataTypes.INTEGER(10),
      allowNull: false,
    },
    seller: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(300),
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    soldout: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: 0,
    },
    password:{
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    phone:{
      type: DataTypes.STRING(20),
      allowNull: false,      
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  });
  return product;
};
