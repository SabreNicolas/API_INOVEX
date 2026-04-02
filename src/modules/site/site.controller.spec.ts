import { Test, TestingModule } from "@nestjs/testing";
import { SiteController } from "./site.controller";
import { SiteService } from "./site.service";
import { AuthGuard } from "../../common/guards/auth.guard";

describe("SiteController", () => {
  let controller: SiteController;

  const mockSiteService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SiteController],
      providers: [{ provide: SiteService, useValue: mockSiteService }],
    })

      .overrideGuard(AuthGuard)

      .useValue({ canActivate: () => true })

      .compile();

    controller = module.get<SiteController>(SiteController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
