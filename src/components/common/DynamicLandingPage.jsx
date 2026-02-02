import React, { useState, useEffect } from "react";
import { supabaseClient } from "@/components/api/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function DynamicLandingPage() {
  const location = useLocation();
  const [activePage, setActivePage] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadActiveLandingPage();
  }, [location.pathname]);

  const loadActiveLandingPage = async () => {
    try {
      const currentPage = location.pathname.replace('/', '') || 'Dashboard';
      const now = new Date().toISOString();
      
      const pages = await supabaseClient.entities.LandingPage.list("-priority", 10);
      const activePage = pages.find(page => 
        page.is_active &&
        page.target_pages?.includes(currentPage) &&
        new Date(page.start_date) <= new Date(now) &&
        new Date(page.end_date) >= new Date(now)
      );

      if (activePage) {
        setActivePage(activePage);
        
        if (activePage.position === "modal") {
          if (activePage.show_once) {
            const hasSeenModal = sessionStorage.getItem(`landing_${activePage.id}`);
            if (!hasSeenModal) {
              setShowModal(true);
              sessionStorage.setItem(`landing_${activePage.id}`, "true");
            }
          } else {
            setShowModal(true);
          }
        }
      } else {
        setActivePage(null);
      }
    } catch (error) {
      console.error("Error loading landing page:", error);
    }
  };

  const handleNavigate = () => {
    if (activePage.button_link.startsWith('http')) {
      window.location.href = activePage.button_link;
    }
  };

  if (!activePage) return null;

  const isExternalLink = activePage.button_link.startsWith('http');

  const LandingContent = () => (
    <div 
      className="relative rounded-xl overflow-hidden shadow-lg"
      style={{ 
        backgroundColor: activePage.background_color,
        color: activePage.text_color
      }}
    >
      <div className="flex flex-col md:flex-row items-center gap-6 p-6">
        {activePage.image_url && (
          <div className="w-full md:w-1/3">
            <img 
              src={activePage.image_url} 
              alt={activePage.title} 
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        )}
        
        <div className="flex-1 space-y-3">
          <h2 className="text-2xl md:text-3xl font-bold">{activePage.title}</h2>
          {activePage.subtitle && (
            <p className="text-lg font-medium opacity-90">{activePage.subtitle}</p>
          )}
          {activePage.description && (
            <p className="opacity-80 leading-relaxed">{activePage.description}</p>
          )}
          
          {isExternalLink ? (
            <Button 
              onClick={handleNavigate}
              className="mt-4"
              style={{ backgroundColor: activePage.text_color, color: activePage.background_color }}
            >
              {activePage.button_text}
            </Button>
          ) : (
            <Link to={createPageUrl(activePage.button_link)}>
              <Button 
                className="mt-4"
                style={{ backgroundColor: activePage.text_color, color: activePage.background_color }}
              >
                {activePage.button_text}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );

  if (activePage.position === "modal") {
    return (
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl p-0 bg-transparent border-none">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-2 z-50 bg-white/80 hover:bg-white rounded-full"
            onClick={() => setShowModal(false)}
          >
            <X className="w-5 h-5" />
          </Button>
          <LandingContent />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: activePage.position === "top" ? -50 : 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: activePage.position === "top" ? -50 : 50 }}
        className={activePage.position === "top" ? "mb-6" : "mt-6"}
      >
        <LandingContent />
      </motion.div>
    </AnimatePresence>
  );
}