'use client'
import { useState, useEffect, useRef } from "react";
import Image from 'next/image'
import data from '../../public/DomainWiseLeaderBoard.json';

type DomainItem = {
    Domain: string;
    Topper: number;
    Individual: number;
    color: string;
    total: number;
    icon?: string;
};

type DataShape = {
    TeamName: string;
    DomainWiseLeaderBoardData: DomainItem[];
};

export function DomainWiseLeaderBoard() {
    const [click, setClick] = useState(false);
    const [mounted, setMounted] = useState(false);
    const popupRef = useRef<HTMLDivElement | null>(null);
    // Data.json can contain the team details under `teamDetails` (see public/Data.json).
    // Use a safe fallback so the component works whether the JSON is the raw shape or nested.
    const raw = data as unknown as ({ teamDetails?: DataShape } | DataShape);
    const typedData = ('teamDetails' in raw && raw.teamDetails) ? raw.teamDetails : (raw as DataShape);
    const TeamName = typedData?.TeamName ?? 'Team';
    const DomainWiseLeaderBoardData = typedData?.DomainWiseLeaderBoardData ?? [];
    const colorMap: Record<string, { light: string; dark: string }> = {
        yellow: { light: '#fef3c7', dark: '#f59e0b' },
        pink: { light: '#fbcfe8', dark: '#fb7185' },
        purple: { light: '#e9d5ff', dark: '#7c3aed' },
        red: { light: '#fecaca', dark: '#ef4444' },
        green: { light: '#bbf7d0', dark: '#10b981' },
        orange: { light: '#ffd8a8', dark: '#f97316' },
        blue: { light: '#bfdbfe', dark: '#3b82f6' },
        gold: { light: '#fff7ed', dark: '#d97706' }
    };
    useEffect(() => {
        // mount animation flag
        setMounted(true);
    }, []);

    // Helper to compute filled percentage (clamped between 0 and 100)
    const percent = (val: number, total: number) => {
        if (!total || !mounted) return 0;
        const p = (val / total) * 100;
        // clamp slightly inside bounds so icon doesn't sit outside the bar
        return Math.min(98, Math.max(2, p));
    };

    // Close popup when clicking outside or pressing Escape
    useEffect(() => {
        if (!click) return;

        const handleOutside = (e: MouseEvent | TouchEvent) => {
            const target = e.target as Node | null;
            if (popupRef.current && target && !popupRef.current.contains(target)) {
                setClick(false);
            }
        };

        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setClick(false);
        };

        document.addEventListener('mousedown', handleOutside);
        document.addEventListener('touchstart', handleOutside);
        document.addEventListener('keydown', handleKey);

        return () => {
            document.removeEventListener('mousedown', handleOutside);
            document.removeEventListener('touchstart', handleOutside);
            document.removeEventListener('keydown', handleKey);
        };
    }, [click]);

    return (
        <>
            {!click && <>
                <div className="fixed top-1 right-5 z-[1000] cursor-pointer w-[340px] h-[130px] bg-no-repeat bg-center bg-cover" onClick={() => setClick(!click)} style={{ fontFamily: "'IM Fell English SC', serif" }}>
                    <div className="mx-12 mt-6">
                        <div className="bg-[url('/team1.svg')] bg-cover bg-center w-70 transform transition-transform duration-200 hover:scale-105">
                            <p className="text-blue font-bold mx-12 text-4xl transform transition-transform text-white duration-200 hover:scale-105">{TeamName}</p>
                        </div>
                        <div className="fixed top-19 right-10 w-[300px] h-6 bg-gray-400 rounded-lg shadow-2xl z-[1000] transform transition-transform duration-200 hover:scale-105" style={{ fontFamily: "'IM Fell English SC', serif" }}>
                            <div
                                className={`h-6 rounded-lg absolute top-0 left-0 transition-all duration-700 ease-out`}
                                style={{
                                    width: mounted ? `${DomainWiseLeaderBoardData[0].Topper / DomainWiseLeaderBoardData[0].total * 100}%` : '0%',
                                    backgroundColor: colorMap[DomainWiseLeaderBoardData[0].color]?.light || '#e5e7eb'
                                }}
                            ></div>
                            <div
                                className={`h-6 rounded-lg absolute flex justify-end top-0 left-0 transition-all duration-700 ease-out z-10`}
                                style={{
                                    width: mounted ? `${DomainWiseLeaderBoardData[0].Individual / DomainWiseLeaderBoardData[0].total * 100}%` : '0%',
                                    backgroundColor: colorMap[DomainWiseLeaderBoardData[0].color]?.dark || '#f59e0b'
                                }}
                            ></div>
                            {DomainWiseLeaderBoardData[0].icon && (
                                <div style={{ position: 'absolute', left: `${percent(DomainWiseLeaderBoardData[0].Individual, DomainWiseLeaderBoardData[0].total)}%`, top: '30%', transform: 'translate(-50%,-50%)', zIndex: 11 }}>
                                    <Image src={DomainWiseLeaderBoardData[0].icon.startsWith('/') ? DomainWiseLeaderBoardData[0].icon : `/${DomainWiseLeaderBoardData[0].icon}`} alt={`${DomainWiseLeaderBoardData[0].Domain} icon`} width={50} height={50} />
                                </div>
                            )}
                        </div>
                        {/*<p className="text-blue font-bold text-2xl mt-10">Your Score: {DomainWiseLeaderBoardData[0].Individual}</p>*/}
                    </div>
                </div>
            </>}
            {click &&
                <>
                    <div ref={popupRef} className={`fixed top-1 right-5 bg-[url('/scroll.jpg')] shadow-2xl text-black p-3 w-[500px] h-[720px] bg-no-repeat z-[1000] rounded-lg transform transition-transform duration-500 ${click ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ fontFamily: "'IM Fell English SC', serif" }}>
                        <p className="font-bold text-xl mx-25">The Plank — Domain Standings</p>
                        <button className="absolute border-solid border-white border-2 w-7 h-7 rounded-[50%] p-0.5 top-1 right-2 text-white hover:text-white hover:bg-[rgba(255,0,0,0.5)] m-3" onClick={() => setClick(false)}>&times;</button>
                        <div className="grid grid-cols-1 grid-rows-8">
                            {DomainWiseLeaderBoardData &&
                                DomainWiseLeaderBoardData.slice(1).map((domain, index) => {
                                    return (
                                        <div key={index}>
                                            <p className="font-bold text-xl">{domain.Domain}</p>
                                            <p className="font-bold text-xl">Your Score: {domain.Individual}</p>
                                            <div className="h-5 bg-gray-400 rounded-lg shadow-md relative m-1 transform transition-transform duration-200 hover:scale-105">
                                                <div
                                                    className={`h-5 rounded-lg absolute top-0 left-0 transition-all duration-300`}
                                                    style={{
                                                        width: mounted ? `${domain.Topper / domain.total * 100}%` : '0%',
                                                        backgroundColor: colorMap[domain.color]?.light || '#e5e7eb'
                                                    }}
                                                ></div>
                                                <div
                                                    className={`h-5 rounded-lg absolute flex justify-end top-0 left-0 transition-all duration-300 z-10`}
                                                    style={{
                                                        width: mounted ? `${domain.Individual / domain.total * 100}%` : '0%',
                                                        backgroundColor: colorMap[domain.color]?.dark || '#f59e0b',
                                                    }}
                                                ></div>
                                                {domain.icon && (
                                                    <div style={{ position: 'absolute', left: `${percent(domain.Individual, domain.total)}%`, top: '50%', transform: 'translate(-50%,-50%)', zIndex: 11 }}>
                                                        <Image src={domain.icon.startsWith('/') ? domain.icon : `/${domain.icon}`} alt={`${domain.Domain} icon`} width={50} height={50} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })
                            }
                            <div>
                                <p className="font-bold text-xl">{DomainWiseLeaderBoardData[0].Domain}</p>
                                <p className="font-bold text-xl">Your Score: {DomainWiseLeaderBoardData[0].Individual}</p>
                                <div className="h-5 bg-gray-400 rounded-lg  relative shadow-md transform transition-transform duration-200 hover:scale-105" style={{ fontFamily: "'IM Fell English SC', serif" }}>
                                    <div
                                        className={`h-5 rounded-lg absolute top-0 left-0 transition-all duration-300`}
                                        style={{
                                            width: `${DomainWiseLeaderBoardData[0].Topper / DomainWiseLeaderBoardData[0].total * 100}%`,
                                            backgroundColor: colorMap[DomainWiseLeaderBoardData[0].color]?.light || '#e5e7eb'
                                        }}
                                    ></div>
                                    <div
                                        className={`h-5 rounded-lg absolute flex justify-end top-0 left-0 transition-all duration-300 z-10`}
                                        style={{
                                            width: `${DomainWiseLeaderBoardData[0].Individual / DomainWiseLeaderBoardData[0].total * 100}%`,
                                            backgroundColor: colorMap[DomainWiseLeaderBoardData[0].color]?.dark || '#f59e0b'
                                        }}
                                    ></div>
                                    {DomainWiseLeaderBoardData[0].icon && (
                                        <div style={{ position: 'absolute', left: `${percent(DomainWiseLeaderBoardData[0].Individual, DomainWiseLeaderBoardData[0].total)}%`, top: '30%', transform: 'translate(-50%,-50%)', zIndex: 11 }}>
                                            <Image src={DomainWiseLeaderBoardData[0].icon.startsWith('/') ? DomainWiseLeaderBoardData[0].icon : `/${DomainWiseLeaderBoardData[0].icon}`} alt={`${DomainWiseLeaderBoardData[0].Domain} icon`} width={50} height={50} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            }
        </>
    );
}