"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Circle, Droplets, Wrench, Settings, Hammer, MapPin, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";

function MaterialShape({
    className,
    delay = 0,
    size = 150,
    rotate = 0,
    gradient = "from-white/[0.08]",
    icon: Icon,
}: {
    className?: string;
    delay?: number;
    size?: number;
    rotate?: number;
    gradient?: string;
    icon?: any;
}) {
    return (
        <motion.div
            initial={{
                opacity: 0,
                y: -150,
                rotate: rotate - 15,
            }}
            animate={{
                opacity: 1,
                y: 0,
                rotate: rotate,
            }}
            transition={{
                duration: 2.4,
                delay,
                ease: [0.23, 0.86, 0.39, 0.96],
                opacity: { duration: 1.2 },
            }}
            className={cn("absolute", className)}
        >
            <motion.div
                animate={{
                    y: [0, 25, 0],
                    scale: [1, 1.05, 1],
                    x: [0, -15, 0]
                }}
                transition={{
                    duration: 20 + delay * 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                }}
                className="relative flex items-center justify-center p-6"
                style={{
                    width: size,
                    height: size,
                }}
            >
                <motion.div
                    animate={{
                        borderRadius: [
                            "41% 59% 70% 30% / 41% 51% 49% 59%",
                            "61% 39% 31% 69% / 61% 31% 69% 39%",
                            "51% 49% 61% 39% / 51% 61% 39% 49%",
                            "41% 59% 70% 30% / 41% 51% 49% 59%"
                        ]
                    }}
                    transition={{
                        duration: 8 + delay * 5, 
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                    }}
                    className={cn(
                        "absolute inset-0 overflow-hidden flex items-center justify-center",
                        "bg-gradient-to-br to-transparent",
                        gradient,
                        "backdrop-blur-[6px] border border-white/[0.2]",
                        "shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]"
                    )}
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_70%)]" />
                    {Icon && (
                        <Icon 
                            className="w-1/2 h-1/2 text-white/50 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] relative z-10" 
                            strokeWidth={1.5} 
                        />
                    )}
                </motion.div>
            </motion.div>
        </motion.div>
    );
}

function HeroGeometric({
    badge = "HYDRAUCAN Dashboard",
    title1 = "Gestion Avancée",
    title2 = "Des Ressources en Eau",
    children
}: {
    badge?: string;
    title1?: string;
    title2?: string;
    children?: React.ReactNode;
}) {
    const fadeUpVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                duration: 1,
                delay: 0.5 + i * 0.2,
                ease: [0.25, 0.4, 0.25, 1] as any,
            },
        }),
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#0F0F0F]"
             style={{ backgroundImage: "radial-gradient(circle at 50% 50%, #1A2B56 0%, #050505 100%)" }}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.05] via-transparent to-blue-500/[0.05] blur-3xl" />

            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <MaterialShape
                    delay={0.3}
                    size={280}
                    rotate={12}
                    icon={Wrench}
                    gradient="from-cyan-500/[0.2] to-transparent"
                    className="left-[-5%] md:left-[5%] top-[10%] md:top-[15%]"
                />

                <MaterialShape
                    delay={0.5}
                    size={240}
                    rotate={-15}
                    icon={Hammer}
                    gradient="from-blue-500/[0.2] to-transparent"
                    className="right-[-5%] md:right-[5%] top-[70%] md:top-[65%]"
                />

                <MaterialShape
                    delay={0.4}
                    size={200}
                    rotate={-8}
                    icon={Truck}
                    gradient="from-[#1A2B56]/[0.6] to-transparent"
                    className="left-[5%] md:left-[15%] bottom-[10%] md:bottom-[15%]"
                />

                <MaterialShape
                    delay={0.6}
                    size={160}
                    rotate={20}
                    icon={MapPin}
                    gradient="from-sky-400/[0.2] to-transparent"
                    className="right-[15%] md:right-[20%] top-[10%] md:top-[12%]"
                />

                <MaterialShape
                    delay={0.7}
                    size={140}
                    rotate={-25}
                    icon={Settings}
                    gradient="from-indigo-400/[0.2] to-transparent"
                    className="left-[25%] md:left-[30%] top-[5%] md:top-[8%]"
                />
                
                <MaterialShape
                    delay={0.2}
                    size={180}
                    rotate={15}
                    icon={Droplets}
                    gradient="from-cyan-300/[0.15] to-transparent"
                    className="right-[40%] md:right-[45%] bottom-[5%] md:bottom-[8%]"
                />
            </div>

            <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 mt-12 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 min-h-[calc(100vh-4rem)]">
                <div className="w-full max-w-xl text-center lg:text-left flex flex-col items-center lg:items-start pt-10 lg:pt-0">
                    <motion.div
                        custom={0}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.1] mb-8 md:mb-12 backdrop-blur-md"
                    >
                        <Droplets className="h-4 w-4 text-cyan-400 fill-cyan-400/50" />
                        <span className="text-sm text-white/80 font-medium tracking-wide">
                            {badge}
                        </span>
                    </motion.div>

                    <motion.div
                        custom={1}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
                            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70 drop-shadow-sm">
                                {title1}
                            </span>
                            <br />
                            <span
                                className={cn(
                                    "bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-sky-200 to-blue-400 drop-shadow-md"
                                )}
                            >
                                {title2}
                            </span>
                        </h1>
                    </motion.div>

                    <motion.div
                        custom={2}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <p className="text-base sm:text-lg text-white/60 leading-relaxed font-light tracking-wide max-w-lg mx-auto lg:mx-0">
                            Plateforme de gestion centralisée des interventions, réparations réseau, et rapports détaillés.
                        </p>
                    </motion.div>
                </div>
                
                {/* Insert standard children inside the animated layout container, taking up the other side */}
                <motion.div
                    custom={3}
                    variants={fadeUpVariants}
                    initial="hidden"
                    animate="visible"
                    className="w-full max-w-md lg:max-w-lg flex justify-center lg:justify-end shrink-0 z-20 pb-12 lg:pb-0"
                >
                    {children}
                </motion.div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent pointer-events-none" />
        </div>
    );
}

export { HeroGeometric }
