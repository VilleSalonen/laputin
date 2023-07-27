package fi.villesalonen.laputin;

import fi.villesalonen.laputin.records.FileRecord;
import fi.villesalonen.laputin.records.QueryRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class FileController {
    private final FileService fileService;

    @Autowired
    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @GetMapping("/files")
    public List<FileRecord> listAll(
        @RequestParam(required = false) String filename,
        @RequestParam(required = false) List<String> paths,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) List<String> hash,
        @RequestParam(required = false) String and,
        @RequestParam(required = false) String or,
        @RequestParam(required = false) String not,
        @RequestParam(defaultValue = "false") Boolean includeInactive
    ) {
        String[] pathsArray = (paths != null) ? paths.toArray(new String[0]) : null;
        String[] hashArray = (hash != null) ? hash.toArray(new String[0]) : null;

        QueryRecord query = new QueryRecord(filename, pathsArray, status, hashArray, and, or, not, includeInactive);
        return fileService.getFiles(query);
    }
}