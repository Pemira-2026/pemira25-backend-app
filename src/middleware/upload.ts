import multer from 'multer';

const storage = multer.memoryStorage();

export const upload = multer({
     storage: storage,
     limits: {
          fileSize: 5 * 1024 * 1024, // 5MB limit
     },
     fileFilter: (req, file, cb) => {
          if (file.mimetype.includes('excel') || file.mimetype.includes('spreadsheetml') || file.mimetype.includes('csv')) {
               cb(null, true);
          } else {
               cb(new Error('Only .xlsx, .xls, or .csv files are allowed!'));
          }
     }
});
