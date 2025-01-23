import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

export default buildModule("SlotMachineModule", (m) => {
    const slotMachine = m.contract("SlotMachine", [], {
        value: parseEther("0.1"),
    });

    return { slotMachine };
});