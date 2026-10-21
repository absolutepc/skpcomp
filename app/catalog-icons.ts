import {Cpu,CircuitBoard,Gpu,MemoryStick,HardDrive,Zap,Fan,PcCase,Monitor,Mouse,Keyboard,Headphones,RectangleHorizontal,Mic,MonitorUp,Webcam} from 'lucide-react';

// Shared catalog/category icons: the same symbols are used in product catalog and PC builder.
export const categoryIcons:Record<string,typeof Cpu>={
 cpu:Cpu,motherboard:CircuitBoard,gpu:Gpu,ram:MemoryStick,ssd:HardDrive,psu:Zap,cooler:Fan,case:PcCase,
 monitor:Monitor,mouse:Mouse,keyboard:Keyboard,headphones:Headphones,mousepad:RectangleHorizontal,
 microphone:Mic,mount:MonitorUp,webcam:Webcam
};
