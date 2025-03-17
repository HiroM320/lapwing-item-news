import { handler } from "./index";

import { scrapeProductList } from "./booth/products";
import { saveScrapedLog } from "./db/dynamodb";
import { fetchLatestProductId } from "./param/ssmParam";
import { createTweet } from "./twitter/twitter";

vi.mock("./param/ssmParam", () => ({
  fetchTwitterApiTokens: vi.fn().mockResolvedValue({
    apiKey: "testApiKey",
    apiSecret: "testApiSecret",
    accessToken: "testAccessToken",
    accessTokenSecret: "testAccessTokenSecret",
  }),
  fetchLatestProductId: vi.fn().mockResolvedValue(Number.MAX_SAFE_INTEGER),
  putLatestProductId: vi.fn(),
}));

vi.mock("./twitter/twitter", () => ({
  client: vi.fn(),
  createTweet: vi.fn(),
}));

vi.mock("./booth/products", () => ({
  buildProductUrl: vi.fn().mockReturnValue("http://example.com"),
  scrapeProductList: vi.fn().mockResolvedValue([{ id: 1, name: "JustDummy" }]),
}));

vi.mock("./db/dynamodb", () => ({
  saveScrapedLog: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
});

const DUMMY_CONTEXT = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: "",
  functionVersion: "",
  invokedFunctionArn: "",
  memoryLimitInMB: "",
  awsRequestId: "",
  logGroupName: "",
  logStreamName: "logStreamName",
  getRemainingTimeInMillis: (): number => {
    throw new Error("Function not implemented.");
  },
  done: (error?: Error, result?: unknown): void => {
    throw new Error("Function not implemented.");
  },
  fail: (error: Error | string): void => {
    throw new Error("Function not implemented.");
  },
  succeed: (messageOrObject: unknown): void => {
    throw new Error("Function not implemented.");
  },
};
const callbackMock = vi.fn();

const DUMMY_PRODUCT_LIST = [
  {
    id: 6707008,
    name: "【13アバター対応】Fantasy Youth Mouton【VRChat向け衣装モデル】",
  },
  {
    id: 6706007,
    name: "【複数アバター対応 3D衣装】マジカルノリヤ / MAGICALNORIYA",
  },
  {
    id: 6705006,
    name: "シュガーヘア 【 2種セット / 髪型 / アップヘア 】 ヘアアクセサリー付き Sugar Hair",
  },
  {
    id: 6704005,
    name: "【3D】Mystic Bloke (森羅/しなの/愛莉/マヌカ/ラシューシャ/萌/桔梗/Lapwing/セレスティア/Sio/水瀬/狛乃対応) #LAYON服 ＃LAYONコーデ",
  },
  {
    id: 6703004,
    name: "キューティショート 【 髪型 / ヘア 】 Cutie Short Hair",
  },
  {
    id: 6702003,
    name: "【15アバター対応】MagicMaid【VRChat】",
  },
  {
    id: 6701002,
    name: "Twist Bun Hair",
  },
  {
    id: 6700001,
    name: "2024年第2弾『エレガントメイド』Elegant Maid 💜",
  },
  {
    id: 6699000,
    name: "Curly Short Cut",
  },
  {
    id: 6698009,
    name: "【Nail&Ring】STARDROPS-もっと、近くへ-【27アバター対応】 #STARDROPLAND",
  },
  {
    id: 6697008,
    name: "320アバター対応【光る】NebulaTexture【導入ガイド付き】",
  },
  {
    id: 6696007,
    name: "四つ葉のピン【VRChat対応】",
  },
  {
    id: 6695006,
    name: "[Lapwing] Phoenix_Ears",
  },
  {
    id: 6694005,
    name: "【Lapwing対応】ミラージュアイテクスチャ",
  },
  {
    id: 6693004,
    name: "【セール中】Lunar Glasses【VRChat用サングラス】",
  },
  {
    id: 6692003,
    name: "洋風の羽織【期間限定】",
  },
  {
    id: 6691002,
    name: "Starlight Eye Texture【glow eyes】",
  },
  {
    id: 6690001,
    name: "【VRChat対応】CosmicNightヘアスタイル【MA対応】",
  },
];

describe("handler", () => {
  const createTweetMock = vi.mocked(createTweet);
  const scrapeProductListMock = vi.mocked(scrapeProductList);
  const fetchLatestProductIdMock = vi.mocked(fetchLatestProductId);
  const saveScrapedLogMock = vi.mocked(saveScrapedLog);

  it("found 0 products and exit early", async () => {
    createTweetMock.mockResolvedValue({
      id: "123",
      rateLimit: { reset: 123, limit: 17, remaining: 10 },
    });
    scrapeProductListMock.mockResolvedValueOnce(DUMMY_PRODUCT_LIST);
    fetchLatestProductIdMock.mockResolvedValueOnce(DUMMY_PRODUCT_LIST[0].id);

    const result = await handler({}, DUMMY_CONTEXT, callbackMock);

    expect(createTweetMock).not.toHaveBeenCalled();
    expect(saveScrapedLogMock).not.toHaveBeenCalled();
    expect(result).toEqual(undefined);
  });

  it("found 1 new product and tweets it", async () => {
    createTweetMock.mockResolvedValue({
      id: "123",
      rateLimit: { reset: 123, limit: 17, remaining: 10 },
    });
    scrapeProductListMock.mockResolvedValueOnce(DUMMY_PRODUCT_LIST);
    fetchLatestProductIdMock.mockResolvedValueOnce(DUMMY_PRODUCT_LIST[1].id);

    const result = await handler({}, DUMMY_CONTEXT, callbackMock);

    expect(createTweetMock).toHaveBeenCalledTimes(1);
    expect(saveScrapedLogMock).toHaveBeenCalledOnce();
    expect(result).toEqual("logStreamName");
  });

  it("found 2 new products and tweets them", async () => {
    createTweetMock.mockResolvedValue({
      id: "123",
      rateLimit: { reset: 123, limit: 17, remaining: 10 },
    });
    scrapeProductListMock.mockResolvedValueOnce(DUMMY_PRODUCT_LIST);
    fetchLatestProductIdMock.mockResolvedValueOnce(DUMMY_PRODUCT_LIST[2].id);

    const result = await handler({}, DUMMY_CONTEXT, callbackMock);

    expect(createTweetMock).toHaveBeenCalledTimes(2);
    expect(saveScrapedLogMock).toHaveBeenCalledOnce();
    expect(result).toEqual("logStreamName");
  });

  it("found 10 new products and tweets them", async () => {
    createTweetMock.mockResolvedValue({
      id: "123",
      rateLimit: { reset: 123, limit: 17, remaining: 10 },
    });
    scrapeProductListMock.mockResolvedValueOnce(DUMMY_PRODUCT_LIST);
    fetchLatestProductIdMock.mockResolvedValueOnce(DUMMY_PRODUCT_LIST[10].id);

    const result = await handler({}, DUMMY_CONTEXT, callbackMock);

    expect(createTweetMock).toHaveBeenCalledTimes(10);
    expect(saveScrapedLogMock).toHaveBeenCalledOnce();
    expect(result).toEqual("logStreamName");
  });

  it("should handle errors gracefully", async () => {
    const error = new Error("Something went wrong");
    scrapeProductListMock.mockRejectedValueOnce(error);

    await expect(handler({}, DUMMY_CONTEXT, callbackMock)).rejects.toThrow(
      "Something went wrong",
    );

    expect(createTweetMock).not.toHaveBeenCalled();
    expect(saveScrapedLogMock).not.toHaveBeenCalled();
  });
});
