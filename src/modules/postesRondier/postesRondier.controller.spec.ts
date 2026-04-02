import { Test, TestingModule } from "@nestjs/testing";

import { PostesRondierController } from "./postesRondier.controller";
import { PostesRondierService } from "./postesRondier.service";
import { AuthGuard } from "../../common/guards/auth.guard";

describe("PostesRondierController", () => {
  let controller: PostesRondierController;

  const mockService = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostesRondierController],
      providers: [{ provide: PostesRondierService, useValue: mockService }],
    })

      .overrideGuard(AuthGuard)

      .useValue({ canActivate: () => true })

      .compile();

    controller = module.get<PostesRondierController>(PostesRondierController);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should return all postes", async () => {
      mockService.findAll.mockResolvedValue([{ id: 1, nom: "Poste" }]);

      const result = await controller.findAll();

      expect(result).toHaveLength(1);
      expect(mockService.findAll).toHaveBeenCalled();
    });
  });
});
