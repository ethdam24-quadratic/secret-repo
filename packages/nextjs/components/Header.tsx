"use client";

import React, { useCallback, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useOutsideClick } from "~~/hooks/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "CREATE",
    href: "/create",
  },
  {
    label: "OVERVIEW",
    href: "/overview",
  },
  {
    label: "home",
    href: "/",
  },
  {
    label: "VOTE",
    href: "/vote",
  },
  {
    label: "DONATE",
    href: "/donate",
  },
];

interface HeaderMenuLinksProps {
  noLogo: boolean;
}

export const HeaderMenuLinks: React.FC<HeaderMenuLinksProps> = ({ noLogo }) => {
  const pathname = usePathname();

  return (
    <>
      {menuLinks.map(({ label, href, icon }) => {
        const isActive = pathname === href;
        if (href === "/" && noLogo) return null;
        if (href === "/")
          return (
            <Link key={href} href={href}>
              <Image src="/logo.png" width={120} height={120} alt="Home" />
            </Link>
          );
        return (
          <li key={href}>
            <Link
              href={href}
              passHref
              className={`${isActive ? "header-active" : ""} text-white gap-2 grid grid-flow-col`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
};

export const Header = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const burgerMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(
    burgerMenuRef,
    useCallback(() => setIsDrawerOpen(false), []),
  );

  return (
    <div className="quadratic-header sticky lg:static top-0 navbar bg-transparent min-h-0 flex-shrink-0 justify-between z-20 px-0 sm:px-2">
      <div className="flex flex-row justify-items-center w-full">
        <div className="lg:hidden dropdown" ref={burgerMenuRef}>
          <label
            tabIndex={0}
            className={`ml-1 btn btn-ghost ${isDrawerOpen ? "hover:bg-transparent" : "hover:bg-transparent"}`}
            onClick={() => {
              setIsDrawerOpen(prevIsOpenState => !prevIsOpenState);
            }}
          >
            <Bars3Icon className="h-1/2" />
          </label>
          {isDrawerOpen && (
            <ul
              tabIndex={0}
              className="menu dropdown-content mt-3 p-2 shadow bg-black rounded-box w-52"
              onClick={() => {
                setIsDrawerOpen(false);
              }}
            >
              <HeaderMenuLinks noLogo={true} />
            </ul>
          )}
        </div>
        <ul className="hidden items-center w-full lg:flex lg:flex-nowrap justify-evenly menu menu-horizontal px-1 gap-2">
          <HeaderMenuLinks noLogo={false} />
        </ul>
      </div>
    </div>
  );
};
