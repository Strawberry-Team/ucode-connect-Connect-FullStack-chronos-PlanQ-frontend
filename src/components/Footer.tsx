import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="w-full bg-gradient-to-br from-gray-100 to-gray-200 border-t border-gray-300">
            <div className="px-4 py-4">
                <p className="text-center text-sm text-gray-500">
                    © {new Date().getFullYear()} Solve Stack. Developed by Denys KOLESNYCHENKO, CS-222a, SEMIT,
                    CSIT, NTU "KhPI", Innovation Campus.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
