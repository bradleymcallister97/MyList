pragma solidity ^0.4.18;

contract List {
    struct Article {
        uint id;
        address seller;
        address buyer;
        string name;
        string description;
        uint256 price;
    }

    mapping (uint => Article) public articles;
    uint articleCounter;

    event LogSellArticle(
        uint indexed _id,
        address indexed _seller,
        string _name,
        uint256 _price
    );
    event LogBuyArticle(
        uint indexed _id,
        address indexed _seller,
        address indexed _buyer,
        string _name,
        uint256 _price
    );

    function sellArticle(string _name, string _description, uint256 _price) public {
        articleCounter++;
        articles[articleCounter] = Article(
            articleCounter,
            msg.sender,
            0x0,
            _name,
            _description,
            _price
        );

        emit LogSellArticle(articleCounter, msg.sender, _name, _price);
    }

    function getNumberArticles() view public returns(uint) {
        return articleCounter;
    }

    function getArticlesForSale() view public returns(uint[]) {
        uint[] memory articleIds = new uint[](articleCounter);
        uint numberOfArticlesForSale = 0;
        for (uint i = 1; i <= articleCounter; i++) {
            if (articles[i].buyer == 0x0) {
                articleIds[numberOfArticlesForSale] = articles[i].id;
                numberOfArticlesForSale++;                
            }
        }
        uint[] memory forSale = new uint[](numberOfArticlesForSale);
        for (uint j = 0; j < numberOfArticlesForSale; j++) {
            forSale[j] = articleIds[j];
        }
        return forSale;
    }

    function buyArticle(uint _id) payable public {
        require(articleCounter > 0);
        require(_id > 0 && _id <= articleCounter);

        Article storage article = articles[_id];

        require(article.buyer == 0x0);
        require(msg.sender != article.seller);
        require(msg.value == article.price);

        article.buyer = msg.sender;
        article.seller.transfer(msg.value);

        emit LogBuyArticle(_id, article.seller, article.buyer, article.name, article.price);
    }
}
